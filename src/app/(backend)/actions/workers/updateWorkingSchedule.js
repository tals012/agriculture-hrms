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
    startTimeInMinutes: timeStringSchema.nullable(),
    endTimeInMinutes: timeStringSchema.nullable(),
    breakTimeInMinutes: z.number().nullable(),
    totalHoursWorked: z.number().nullable(),
    totalContainersFilled: z.number().nullable(),
    totalWage: z.number().nullable(),
    isBreakTimePaid: z.boolean().optional().default(false),
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
      .default("WORKING"),
  })
  .transform((data) => {
    // Convert time strings to minutes
    const convertTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    return {
      ...data,
      startTimeInMinutes: convertTimeToMinutes(data.startTimeInMinutes),
      endTimeInMinutes: convertTimeToMinutes(data.endTimeInMinutes),
    };
  });

const updateWorkingSchedule = async (input) => {
  try {
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

    // Get worker to check if exists and get current client
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

    // Get the active group and its pricing combination
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

    // Check if worker already has a personal schedule
    const existingPersonalSchedule = await prisma.workingSchedule.findFirst({
      where: { workerId },
      orderBy: { createdAt: "desc" },
    });

    // If no personal schedule exists, create one based on the current schedule being used
    if (!existingPersonalSchedule) {
      // Get the current schedule following the priority system
      const currentSchedule = await prisma.workingSchedule.findFirst({
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
            workerId: workerId,
          },
        });
      }
    }

    // Check if attendance record already exists for this date
    const existingRecord = await prisma.workerAttendance.findFirst({
      where: {
        workerId,
        attendanceDate: new Date(date),
      },
    });

    // Create or update the attendance record
    const attendanceRecord = await prisma.workerAttendance.upsert({
      where: {
        id: existingRecord?.id || "new", // 'new' for creation
      },
      create: {
        workerId,
        attendanceDate: new Date(date),
        startTimeInMinutes,
        endTimeInMinutes,
        breakTimeInMinutes,
        totalHoursWorked,
        totalContainersFilled,
        totalWage,
        isBreakTimePaid,
        status,
        combinationId,
        groupId: activeGroup.id,
        attendanceDoneBy: "ADMIN",
      },
      update: {
        startTimeInMinutes,
        endTimeInMinutes,
        breakTimeInMinutes,
        totalHoursWorked,
        totalContainersFilled,
        totalWage,
        isBreakTimePaid,
        status,
      },
    });

    return {
      status: 200,
      message: "Attendance record updated successfully",
      data: attendanceRecord,
    };
  } catch (error) {
    console.error("Error updating working schedule:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
};

export default updateWorkingSchedule;
