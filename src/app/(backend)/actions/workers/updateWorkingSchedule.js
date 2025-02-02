"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const timeStringSchema = z.string().regex(/^\d{2}:\d{2}$/, {
  message: "Time must be in HH:mm format",
});

const updateWorkingScheduleSchema = z
  .object({
    workerId: z.string(),
    date: z.string(), // ISO date string
    startTimeInMinutes: z.number().nullable(),
    endTimeInMinutes: z.number().nullable(),
    breakTimeInMinutes: z.number().nullable(),
    totalHoursWorked: z.number().nullable(),
    totalContainersFilled: z.number().nullable(),
    totalWage: z.number().nullable(),
    isBreakTimePaid: z.boolean().optional().default(false),
    status: z.enum([
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
    ]),
  })
  .partial() // Make all fields optional except workerId and date
  .required({ workerId: true, date: true }); // These fields are always required

const updateWorkingSchedule = async (input) => {
  try {
    console.log("input", input);
    const parsedData = updateWorkingScheduleSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors,
      };
    }

    const {
      workerId,
      date,
      startTimeInMinutes,
      endTimeInMinutes,
      breakTimeInMinutes,
      totalHoursWorked,
      totalContainersFilled,
      totalWage,
      isBreakTimePaid,
      status,
    } = parsedData.data;

    // * Get worker to check if exists and get current client
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
        message: "Worker not found",
      };
    }

    // * Get the active group and its pricing combination
    const activeGroup = worker.groups.find(
      (membership) => !membership.endDate
    )?.group;
    if (!activeGroup || !activeGroup.clientPricingCombination?.[0]) {
      return {
        status: 400,
        message: "Worker must be assigned to a group with pricing combination",
      };
    }

    const combinationId = activeGroup.clientPricingCombination[0].id;

    // * Check if worker already has a personal schedule
    const existingPersonalSchedule = await prisma.workingSchedule.findFirst({
      where: { workerId },
      orderBy: { createdAt: "desc" },
    });

    // * If no personal schedule exists, create one based on the current schedule being used
    let currentSchedule;
    if (!existingPersonalSchedule) {
      // * Get the current schedule following the priority system
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

      if (currentSchedule) {
        // Create a personal schedule for the worker based on the current schedule
        await prisma.workingSchedule.create({
          data: {
            source: "WORKER",
            numberOfTotalHoursPerDay: currentSchedule.numberOfTotalHoursPerDay,
            numberOfTotalDaysPerWeek: currentSchedule.numberOfTotalDaysPerWeek,
            numberOfTotalDaysPerMonth:
              currentSchedule.numberOfTotalDaysPerMonth,
            startTimeInMinutes: currentSchedule.startTimeInMinutes,
            endTimeInMinutes: currentSchedule.endTimeInMinutes,
            breakTimeInMinutes: currentSchedule.breakTimeInMinutes,
            isBreakTimePaid: currentSchedule.isBreakTimePaid,
            numberOfTotalHoursPerDayWindow100: currentSchedule.numberOfTotalHoursPerDayWindow100,
            numberOfTotalHoursPerDayWindow125: currentSchedule.numberOfTotalHoursPerDayWindow125,
            numberOfTotalHoursPerDayWindow150: currentSchedule.numberOfTotalHoursPerDayWindow150,
            workerId: workerId,
          },
        });

      }
    }

    let strtTime =
      startTimeInMinutes ??
      existingPersonalSchedule?.startTimeInMinutes ??
      currentSchedule?.startTimeInMinutes;
    let endTime =
      endTimeInMinutes ??
      existingPersonalSchedule?.endTimeInMinutes ??
      currentSchedule?.endTimeInMinutes;
    let breakTime =
      breakTimeInMinutes ??
      existingPersonalSchedule?.breakTimeInMinutes ??
      currentSchedule?.breakTimeInMinutes;
    let isPaidBreak =
      isBreakTimePaid ??
      existingPersonalSchedule?.isBreakTimePaid ??
      currentSchedule?.isBreakTimePaid;

    // Calculate total working hours based on break time payment status
    const totalMinutes = endTime - strtTime;
    const calculatedTotalHours = isPaidBreak
      ? totalMinutes / 60  // If break is paid, include break time in total hours
      : (totalMinutes - breakTime) / 60;  // If break is unpaid, subtract break time

    // Calculate overtime windows based on Israeli labor laws
    const hoursWindow100 = Math.min(calculatedTotalHours, 8);
    const hoursWindow125 = Math.min(Math.max(calculatedTotalHours - 8, 0), 2);
    const hoursWindow150 = Math.min(Math.max(calculatedTotalHours - 10, 0), 2);

    // Check if attendance record already exists for this date
    const existingRecord = await prisma.workerAttendance.findFirst({
      where: {
        workerId,
        attendanceDate: new Date(date),
      },
    });

    // *Create or update the attendance record
    const attendanceRecord = await prisma.workerAttendance.upsert({
      where: {
        id: existingRecord?.id || "new", // 'new' for creation
      },
      create: {
        workerId,
        attendanceDate: new Date(date),
        startTimeInMinutes: startTimeInMinutes
          ? startTimeInMinutes
          : existingPersonalSchedule
          ? existingPersonalSchedule?.startTimeInMinutes
          : currentSchedule?.startTimeInMinutes,
        endTimeInMinutes: endTimeInMinutes
          ? endTimeInMinutes
          : existingPersonalSchedule
          ? existingPersonalSchedule?.endTimeInMinutes
          : currentSchedule?.endTimeInMinutes,
        breakTimeInMinutes:
          breakTimeInMinutes ??
          existingPersonalSchedule?.breakTimeInMinutes ??
          currentSchedule?.breakTimeInMinutes,

        totalHoursWorked: totalHoursWorked ?? calculatedTotalHours,
        totalHoursWorkedWindow100: hoursWindow100,
        totalHoursWorkedWindow125: hoursWindow125,
        totalHoursWorkedWindow150: hoursWindow150,
        totalContainersFilled:
          totalContainersFilled ??
          existingPersonalSchedule?.totalContainersFilled ??
          currentSchedule?.totalContainersFilled ??
          0,
        totalWage:
          totalWage ??
          existingPersonalSchedule?.totalWage ??
          currentSchedule?.totalWage ??
          0,
        isBreakTimePaid: isPaidBreak,

        status: status ?? "WORKING",
        combinationId,
        groupId: activeGroup.id,
        attendanceDoneBy: "ADMIN",
      },
      update: {
        startTimeInMinutes:
          startTimeInMinutes ??
          existingPersonalSchedule?.startTimeInMinutes ??
          currentSchedule?.startTimeInMinutes,
        endTimeInMinutes:
          endTimeInMinutes ??
          existingPersonalSchedule?.endTimeInMinutes ??
          currentSchedule?.endTimeInMinutes,
        breakTimeInMinutes:
          breakTimeInMinutes ??
          existingPersonalSchedule?.breakTimeInMinutes ??
          currentSchedule?.breakTimeInMinutes,

        totalHoursWorked: totalHoursWorked ?? calculatedTotalHours,
        totalHoursWorkedWindow100: hoursWindow100,
        totalHoursWorkedWindow125: hoursWindow125,
        totalHoursWorkedWindow150: hoursWindow150,
        totalContainersFilled:
          totalContainersFilled ??
          existingPersonalSchedule?.totalContainersFilled ??
          currentSchedule?.totalContainersFilled ??
          0,
        totalWage:
          totalWage ??
          existingPersonalSchedule?.totalWage ??
          currentSchedule?.totalWage ??
          0,

        isBreakTimePaid: isPaidBreak,

        status: status ?? "WORKING",
      },
    });

    return {
      status: 200,
      message: "Attendance record updated successfully",
      data: attendanceRecord,
    };
  } catch (error) {
    console.error("Error updating working schedule:", error.stack);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
};

export default updateWorkingSchedule;
