"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

// Define the Zod schema for worker attendance
const workerAttendanceSchema = z.object({
  workerId: z.string(),
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
  ]).default("WORKING"),
  containersFilled: z.number().optional(),
});

// Define the main action schema
const submitAttendanceSchema = z.object({
  administratorName: z.string().min(1, "שם מנהל הוא שדה חובה"),
  date: z.string().or(z.date()),
  combinationId: z.string(),
  groupId: z.string(),
  managerId: z.string().optional(),
  issues: z.array(z.string()).optional(),
  otherIssueText: z.string().optional(),
  workersAttendance: z.array(workerAttendanceSchema),
});

export async function submitAttendance(input) {
  try {
    // Validate input
    const parsedData = submitAttendanceSchema.safeParse(input);
    if (!parsedData.success) {
      return {
        status: 400,
        message: "המידע שהוזן אינו תקין",
        errors: parsedData.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
      };
    }

    const {
      administratorName,
      date,
      combinationId,
      groupId,
      managerId,
      issues,
      otherIssueText,
      workersAttendance,
    } = parsedData.data;

    // Verify the pricing combination exists
    const combination = await prisma.clientPricingCombination.findUnique({
      where: { id: combinationId },
    });

    if (!combination) {
      return {
        status: 404,
        message: "תמחור לא נמצא",
      };
    }

    // Verify the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return {
        status: 404,
        message: "קבוצה לא נמצאה",
      };
    }

    // Process each worker's attendance
    const attendanceRecords = await Promise.all(
      workersAttendance.map(async (workerData) => {
        const { workerId, status, containersFilled } = workerData;

        // Verify worker exists
        const worker = await prisma.worker.findUnique({
          where: { id: workerId },
        });

        if (!worker) {
          throw new Error(`Worker with ID ${workerId} not found`);
        }

        // Get default schedule for time calculations
        const defaultSchedule = await prisma.workingSchedule.findFirst({
          where: {
            OR: [
              { workerId },
              { groupId },
              { fieldId: group.fieldId },
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

        // Default values
        const defaultStartTime = defaultSchedule?.startTimeInMinutes || 480; // 8 AM
        const defaultEndTime = defaultSchedule?.endTimeInMinutes || 1020; // 5 PM
        const defaultBreakTime = defaultSchedule?.breakTimeInMinutes || 30;
        const isBreakTimePaid = defaultSchedule?.isBreakTimePaid || false;

        // Calculate working hours and times based on containers filled
        let calculatedValues = {
          totalHoursWorked: null,
          startTimeInMinutes: defaultStartTime,
          endTimeInMinutes: defaultEndTime,
          breakTimeInMinutes: defaultBreakTime,
          totalHoursWorkedWindow100: null,
          totalHoursWorkedWindow125: null,
          totalHoursWorkedWindow150: null,
        };

        // Only calculate if status is WORKING and containers are provided
        if (status === "WORKING" && containersFilled !== undefined && containersFilled !== null) {
          // Calculate total hours based on containers and container norm
          const totalHours = (containersFilled / combination.containerNorm) * 8;
          
          // Calculate end time by adding total hours to start time
          const endTimeInMinutes = defaultStartTime + Math.round(totalHours * 60);
          
          // Calculate overtime windows
          const hoursWindow100 = Math.min(totalHours, 8);
          const hoursWindow125 = Math.min(Math.max(totalHours - 8, 0), 2);
          const hoursWindow150 = Math.max(totalHours - 10, 0);
          
          calculatedValues = {
            totalHoursWorked: Math.round(totalHours * 100) / 100,
            startTimeInMinutes: defaultStartTime,
            endTimeInMinutes,
            breakTimeInMinutes: defaultBreakTime,
            totalHoursWorkedWindow100: Math.round(hoursWindow100 * 100) / 100,
            totalHoursWorkedWindow125: Math.round(hoursWindow125 * 100) / 100,
            totalHoursWorkedWindow150: Math.round(hoursWindow150 * 100) / 100,
          };
        }

        // Prepare issues array with other issue text if provided
        let finalIssues = issues || [];
        if (otherIssueText && issues?.includes('other')) {
          finalIssues = [...finalIssues, otherIssueText];
        }

        // Create attendance record
        return prisma.workerAttendance.create({
          data: {
            workerId,
            attendanceDate: new Date(date),
            attendanceDoneBy: managerId ? "MANAGER" : "ADMIN",
            attendanceAdministratorName: administratorName,
            combinationId,
            groupId,
            managerId,
            status,
            issues: finalIssues,
            totalContainersFilled: status === "WORKING" ? containersFilled : null,
            startTimeInMinutes: calculatedValues.startTimeInMinutes,
            endTimeInMinutes: calculatedValues.endTimeInMinutes,
            breakTimeInMinutes: calculatedValues.breakTimeInMinutes,
            isBreakTimePaid,
            totalHoursWorked: calculatedValues.totalHoursWorked,
            totalHoursWorkedWindow100: calculatedValues.totalHoursWorkedWindow100,
            totalHoursWorkedWindow125: calculatedValues.totalHoursWorkedWindow125,
            totalHoursWorkedWindow150: calculatedValues.totalHoursWorkedWindow150,
          },
        });
      })
    );

    return {
      status: 201,
      message: "דיווח הנוכחות נשלח בהצלחה",
      data: attendanceRecords,
    };
  } catch (error) {
    console.error("Error submitting attendance:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
}

export default submitAttendance; 