"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const timeStringSchema = z.string().regex(/^\d{2}:\d{2}$/, {
  message: "הזמן חייב להיות בפורמט HH:mm",
});

const updateWorkingScheduleSchema = z
  .object({
    workerId: z.string(),
    date: z.string(), // ISO date string
    startTimeInMinutes: z.number().nullable().optional(),
    endTimeInMinutes: z.number().nullable().optional(),
    breakTimeInMinutes: z.number().nullable().optional(),
    totalHoursWorked: z.number().nullable(),
    totalContainersFilled: z.number().nullable().optional(),
    totalWage: z.number().nullable(),
    isBreakTimePaid: z.boolean().nullable().optional(),
    combinationId: z.string().nullable().optional(),
    status: z
      .enum([
        "WORKING",
        "SICK_LEAVE",
        "DAY_OFF",
        "HOLIDAY",
        "INTER_VISA",
        "NO_SCHEDULE",
        "ABSENT",
        "DAY_OFF_PERSONAL_REASON",
        "WEEKEND",
        "ACCIDENT",
        "NOT_WORKING_BUT_PAID",
      ])
      .optional(),
  })
  .partial()
  .required({ workerId: true, date: true });

const calculateWorkingHoursAndTimes = (
  containersFilled,
  containerNorm,
  defaultStartTime
) => {
  if (
    !containersFilled ||
    !containerNorm ||
    defaultStartTime === null ||
    defaultStartTime === undefined
  )
    return null;

  // Calculate total hours proportionally:
  // If containerNorm = 3 and containersFilled = 3, then totalHours = 8
  // If containerNorm = 3 and containersFilled = 1.5, then totalHours = 4
  const totalHours = (containersFilled / containerNorm) * 8;

  // Calculate end time by adding total hours to start time
  const endTimeInMinutes = defaultStartTime + Math.round(totalHours * 60);

  // Calculate overtime windows based on total hours
  const hoursWindow100 = Math.min(totalHours, 8);
  const hoursWindow125 = Math.min(Math.max(totalHours - 8, 0), 2);
  const hoursWindow150 = Math.max(totalHours - 10, 0);

  return {
    totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
    startTimeInMinutes: defaultStartTime,
    endTimeInMinutes,
    hoursWindow100: Math.round(hoursWindow100 * 100) / 100,
    hoursWindow125: Math.round(hoursWindow125 * 100) / 100,
    hoursWindow150: Math.round(hoursWindow150 * 100) / 100,
  };
};

const calculateFromTimes = (startTime, endTime, containerNorm) => {
  if (!startTime || !endTime || endTime <= startTime || !containerNorm)
    return null;

  // Calculate total hours from time difference
  const totalHours = (endTime - startTime) / 60;

  // Calculate containers based on hours worked and container norm
  // Example: If totalHours = 8 and containerNorm = 4, then containers = 4
  // Example: If totalHours = 4 and containerNorm = 3, then containers = 1.5
  const totalContainers = (totalHours / 8) * containerNorm;

  // Calculate overtime windows
  const hoursWindow100 = Math.min(totalHours, 8);
  const hoursWindow125 = Math.min(Math.max(totalHours - 8, 0), 2);
  const hoursWindow150 = Math.max(totalHours - 10, 0);

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalContainers: Math.round(totalContainers * 100) / 100,
    hoursWindow100: Math.round(hoursWindow100 * 100) / 100,
    hoursWindow125: Math.round(hoursWindow125 * 100) / 100,
    hoursWindow150: Math.round(hoursWindow150 * 100) / 100,
  };
};

const calculateContainers = (totalHours, containerNorm) => {
  if (!totalHours || !containerNorm) return null;

  // Calculate containers based on hours worked
  // Example: If totalHours = 8 and containerNorm = 5, then containers = 5
  // Example: If totalHours = 4 and containerNorm = 3, then containers = 1.5
  return (totalHours / 8) * containerNorm;
};

const updateWorkingSchedule = async (input) => {
  try {
    const parsedData = updateWorkingScheduleSchema.safeParse(input);

    console.log(parsedData.data, "parsedData.data");

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
      };
    }

    const {
      workerId,
      date,
      startTimeInMinutes: inputStartTime,
      endTimeInMinutes: inputEndTime,
      breakTimeInMinutes: inputBreakTime,
      totalHoursWorked: inputTotalHours,
      totalContainersFilled: inputContainers,
      totalWage,
      isBreakTimePaid,
      combinationId,
      status,
    } = parsedData.data;

    // Get existing record to check values
    const existingRecord = await prisma.workerAttendance.findFirst({
      where: {
        workerId,
        attendanceDate: new Date(date),
      },
    });

    // Prevent updates to fields other than status when status is not WORKING
    if (
      existingRecord &&
      existingRecord.status !== "WORKING" &&
      status === undefined
    ) {
      return {
        status: 400,
        message: "לא ניתן לעדכן שדות כאשר הסטטוס אינו 'עובד'",
      };
    }

    // Check if we're just updating individual fields
    const isTimeUpdate =
      inputStartTime !== undefined || inputEndTime !== undefined;
    const isPricingUpdate = combinationId !== undefined;
    const isContainersUpdate = inputContainers !== undefined;

    // For time updates, ensure pricing and containers exist (either in current update or existing record)
    if (isTimeUpdate) {
      const hasPricing = combinationId || existingRecord?.combinationId;
      const hasContainers =
        inputContainers !== undefined ||
        existingRecord?.totalContainersFilled !== null;

      if (!hasPricing || !hasContainers) {
        return {
          status: 400,
          message: "לא ניתן לעדכן זמנים ללא תמחור ומכלים",
        };
      }
    }

    // For new entries or complete updates, ensure both pricing and containers are provided together
    if (
      !existingRecord &&
      ((combinationId && !inputContainers) ||
        (!combinationId && inputContainers))
    ) {
      return {
        status: 400,
        message: "נדרש לספק גם תמחור וגם מכלים עבור רשומות חדשות",
      };
    }

    // Get the pricing combination if provided or exists
    let combination = null;
    const combinationIdToUse = combinationId || existingRecord?.combinationId;

    if (combinationIdToUse) {
      combination = await prisma.clientPricingCombination.findUnique({
        where: { id: combinationIdToUse },
      });

      if (!combination) {
        return {
          status: 400,
          message: "מזהה תמחור לא תקין",
        };
      }
    }

    // Get worker with their active group and pricing combination
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        groups: {
          include: {
            group: {
              include: {
                clientPricingCombination: true,
              },
            },
          },
        },
      },
    });

    if (!worker) {
      return {
        status: 404,
        message: "העובד לא נמצא",
      };
    }

    // Get the active group
    const activeGroup = worker.groups.find(
      (membership) => !membership.endDate
    )?.group;

    if (!activeGroup) {
      return {
        status: 400,
        message: "העובד חייב להיות משויך לקבוצה",
      };
    }

    // Use the provided combination's container norm or get from active group
    const containerNorm =
      combination?.containerNorm ||
      activeGroup.clientPricingCombination?.[0]?.containerNorm;

    if (!containerNorm && (status === "WORKING" || status === undefined)) {
      return {
        status: 400,
        message: "לא נמצאה נורמת מכלים עבור קבוצת העובד או התמחור שסופק",
      };
    }

    // Get existing schedule for default values
    const existingPersonalSchedule = await prisma.workingSchedule.findFirst({
      where: { workerId },
      orderBy: { createdAt: "desc" },
    });

    // Get current schedule following priority system if no personal schedule exists
    let currentSchedule;
    if (!existingPersonalSchedule) {
      currentSchedule = await prisma.workingSchedule.findFirst({
        where: {
          OR: [
            { groupId: activeGroup.id },
            { fieldId: activeGroup.field?.id },
            { clientId: worker.currentClientId },
            { organizationId: { not: null } },
          ],
        },
        orderBy: [
          { workerId: "desc" },
          { groupId: "desc" },
          { fieldId: "desc" },
          { clientId: "desc" },
          { organizationId: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    // Default times from schedule
    const defaultStartTime =
      existingPersonalSchedule?.startTimeInMinutes ??
      currentSchedule?.startTimeInMinutes ??
      480; // 8 AM default

    let calculatedValues = {
      totalHoursWorked: null,
      totalContainersFilled: null,
      startTimeInMinutes: null,
      endTimeInMinutes: null,
      totalHoursWorkedWindow100: null,
      totalHoursWorkedWindow125: null,
      totalHoursWorkedWindow150: null,
    };

    // Check if any relevant values have changed
    const hasContainersChanged =
      inputContainers !== undefined &&
      inputContainers !== existingRecord?.totalContainersFilled;
    const hasStartTimeChanged =
      inputStartTime !== undefined &&
      inputStartTime !== existingRecord?.startTimeInMinutes;
    const hasEndTimeChanged =
      inputEndTime !== undefined &&
      inputEndTime !== existingRecord?.endTimeInMinutes;
    const hasContainerNormChanged =
      combinationId && combinationId !== existingRecord?.combinationId;

    // If any relevant value has changed, recalculate everything
    if (
      hasContainersChanged ||
      hasStartTimeChanged ||
      hasEndTimeChanged ||
      hasContainerNormChanged
    ) {
      // Priority 1: Use containers if provided or changed
      if (inputContainers !== undefined) {
        const calculated = calculateWorkingHoursAndTimes(
          inputContainers,
          containerNorm,
          inputStartTime ??
            existingRecord?.startTimeInMinutes ??
            defaultStartTime
        );

        if (calculated) {
          calculatedValues = {
            totalHoursWorked: calculated.totalHours,
            totalContainersFilled: inputContainers,
            startTimeInMinutes: calculated.startTimeInMinutes,
            endTimeInMinutes: calculated.endTimeInMinutes,
            totalHoursWorkedWindow100: calculated.hoursWindow100,
            totalHoursWorkedWindow125: calculated.hoursWindow125,
            totalHoursWorkedWindow150: calculated.hoursWindow150,
          };
        }
      }
      // Priority 2: Use times if both are available
      else if (inputStartTime !== undefined || inputEndTime !== undefined) {
        const startTime =
          inputStartTime ??
          existingRecord?.startTimeInMinutes ??
          defaultStartTime;
        const endTime = inputEndTime ?? existingRecord?.endTimeInMinutes;

        if (startTime !== null && endTime !== null) {
          const calculated = calculateFromTimes(
            startTime,
            endTime,
            containerNorm
          );

          if (calculated) {
            calculatedValues = {
              totalHoursWorked: calculated.totalHours,
              totalContainersFilled: calculated.totalContainers,
              startTimeInMinutes: startTime,
              endTimeInMinutes: endTime,
              totalHoursWorkedWindow100: calculated.hoursWindow100,
              totalHoursWorkedWindow125: calculated.hoursWindow125,
              totalHoursWorkedWindow150: calculated.hoursWindow150,
            };
          }
        }
      }
    }

    // Create or update the attendance record
    const attendanceData = {
      workerId,
      status: status ?? existingRecord?.status ?? "WORKING",
      ...(calculatedValues.startTimeInMinutes !== null && {
        startTimeInMinutes: calculatedValues.startTimeInMinutes,
      }),
      ...(calculatedValues.endTimeInMinutes !== null && {
        endTimeInMinutes: calculatedValues.endTimeInMinutes,
      }),
      ...(inputBreakTime !== undefined && {
        breakTimeInMinutes: inputBreakTime,
      }),
      ...(isBreakTimePaid !== undefined && { isBreakTimePaid }),
      ...(calculatedValues.totalContainersFilled !== null && {
        totalContainersFilled: calculatedValues.totalContainersFilled,
      }),
      ...(combinationId !== undefined && { combinationId }),
      ...(calculatedValues.totalHoursWorked !== null && {
        totalHoursWorked: calculatedValues.totalHoursWorked,
      }),
      ...(calculatedValues.totalHoursWorkedWindow100 !== null && {
        totalHoursWorkedWindow100: calculatedValues.totalHoursWorkedWindow100,
      }),
      ...(calculatedValues.totalHoursWorkedWindow125 !== null && {
        totalHoursWorkedWindow125: calculatedValues.totalHoursWorkedWindow125,
      }),
      ...(calculatedValues.totalHoursWorkedWindow150 !== null && {
        totalHoursWorkedWindow150: calculatedValues.totalHoursWorkedWindow150,
      }),
      ...(totalWage !== undefined && { totalWage }),
      attendanceDate: new Date(date),
      attendanceDoneBy: "ADMIN",
      groupId: activeGroup.id,
    };

    // For new records, ensure these fields are included
    if (!existingRecord) {
      attendanceData.attendanceDate = new Date(date);
      attendanceData.attendanceDoneBy = "ADMIN";
      attendanceData.groupId = activeGroup.id;
    }

    attendanceData.approvalStatus = "APPROVED";

    console.log(attendanceData, "attendanceData");

    // Check if there's a REJECTED record with the same date, and delete it if exists
    const rejectedRecord = await prisma.workerAttendance.findFirst({
      where: {
        workerId,
        attendanceDate: new Date(date),
        approvalStatus: "REJECTED"
      }
    });

    if (rejectedRecord) {
      // Delete the rejected record
      await prisma.workerAttendance.delete({
        where: {
          id: rejectedRecord.id
        }
      });
      console.log(`Deleted rejected record with ID: ${rejectedRecord.id}`);
    }

    const attendanceRecord = await prisma.workerAttendance.upsert({
      where: {
        id: existingRecord?.id || "new",
      },
      create: attendanceData,
      update: attendanceData,
    });

    return {
      status: 200,
      message: "הנוכחות עודכנה בהצלחה",
      data: attendanceRecord,
    };
  } catch (error) {
    console.error("Error updating working schedule:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
};

export default updateWorkingSchedule;
