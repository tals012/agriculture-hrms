"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const generateScheduleSchema = z.object({
  numberOfTotalHoursPerDay: z.number().min(1).max(12),
  numberOfTotalDaysPerWeek: z.number().min(1).max(7),
  startTimeInMinutes: z.number().min(0).max(1440),
  breakTimeInMinutes: z.number().min(0).max(240),
  isBreakTimePaid: z.boolean(),
  clientId: z.string().optional(),
  groupId: z.string().optional(),
  workerId: z.string().optional(),
});

const generateSchedule = async (input) => {
  try {
    const parsedData = generateScheduleSchema.safeParse(input);

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
      numberOfTotalHoursPerDay,
      numberOfTotalDaysPerWeek,
      startTimeInMinutes,
      breakTimeInMinutes,
      isBreakTimePaid,
      clientId,
      groupId,
      workerId,
    } = parsedData.data;

    // Calculate total minutes and end time
    let totalMinutes = numberOfTotalHoursPerDay * 60;
    
    // If break is not paid, subtract break time from total working hours
    if (!isBreakTimePaid) {
      totalMinutes -= breakTimeInMinutes;
    }
    
    const endTimeInMinutes = startTimeInMinutes + totalMinutes;

    // Calculate actual working hours (for display)
    const actualTotalHoursPerDay = !isBreakTimePaid 
      ? numberOfTotalHoursPerDay - (breakTimeInMinutes / 60)
      : numberOfTotalHoursPerDay;

    // Calculate overtime windows based on Israeli labor laws
    const numberOfTotalHoursPerDayWindow100 = Math.min(actualTotalHoursPerDay, 8);
    const numberOfTotalHoursPerDayWindow125 = Math.min(Math.max(actualTotalHoursPerDay - 8, 0), 2);
    const numberOfTotalHoursPerDayWindow150 = Math.min(Math.max(actualTotalHoursPerDay - 10, 0), 2);

    // Calculate total days per month (average)
    const numberOfTotalDaysPerMonth = numberOfTotalDaysPerWeek * 4.33;

    // Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return {
        status: 404,
        message: "הארגון לא נמצא",
      };
    }

    // Determine which IDs to use based on priority
    let scheduleData = {
      numberOfTotalHoursPerDay: actualTotalHoursPerDay,
      numberOfTotalHoursPerDayWindow100: numberOfTotalHoursPerDayWindow100,
      numberOfTotalHoursPerDayWindow125: numberOfTotalHoursPerDayWindow125,
      numberOfTotalHoursPerDayWindow150: numberOfTotalHoursPerDayWindow150,
      numberOfTotalDaysPerWeek,
      numberOfTotalDaysPerMonth,
      startTimeInMinutes,
      endTimeInMinutes,
      breakTimeInMinutes,
      isBreakTimePaid,
    };

    // Priority 1: Worker
    if (workerId) {
      scheduleData = {
        ...scheduleData,
        workerId,
        organizationId: organization.id,
        source: "WORKER"
      };
    }
    // Priority 2: Group
    else if (groupId) {
      scheduleData = {
        ...scheduleData,
        groupId,
        organizationId: organization.id,
        source: "GROUP"
      };
    }
    // Priority 3: Client
    else if (clientId) {
      scheduleData = {
        ...scheduleData,
        clientId,
        organizationId: organization.id,
        source: "CLIENT"
      };
    }
    // Priority 4: Organization
    else {
      scheduleData = {
        ...scheduleData,
        organizationId: organization.id,
        source: "ORGANIZATION"
      };
    }

    // Create the schedule
    const schedule = await prisma.workingSchedule.create({
      data: scheduleData
    });

    return {
      status: 200,
      message: "לוח הזמנים נוצר בהצלחה",
      data: schedule,
    };
  } catch (error) {
    console.error("Error generating schedule:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
};

export default generateSchedule;
