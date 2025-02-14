"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const getScheduleSchema = z.object({
  clientId: z.string().optional(),
  fieldId: z.string().optional(),
  groupId: z.string().optional(),
  workerId: z.string().optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2100),
});

const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

const isWeekend = (date, numberOfTotalDaysPerWeek) => {
  const dayOfWeek = date.getDay();
  
  // If 5 working days: Friday (5) and Saturday (6) are weekends
  if (numberOfTotalDaysPerWeek === 5) {
    return dayOfWeek === 5 || dayOfWeek === 6;
  }
  
  // If 6 working days: only Saturday (6) is weekend
  if (numberOfTotalDaysPerWeek === 6) {
    return dayOfWeek === 6;
  }
  
  // If 7 working days: no weekends
  return false;
};

const getSchedule = async (input) => {
  try {
    const parsedData = getScheduleSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "נתונים לא תקינים",
        errors: formattedErrors,
      };
    }

    const { clientId, fieldId, groupId, workerId, month, year } = parsedData.data;

    // Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return {
        status: 404,
        message: "הארגון לא נמצא",
      };
    }

    // Build where clause based on priority
    let whereClause = { organizationId: organization.id };

    // Priority: worker > group > field > client > organization
    if (workerId) {
      whereClause = { workerId };
    } else if (groupId) {
      whereClause = { groupId };
    } else if (fieldId) {
      whereClause = { fieldId };
    } else if (clientId) {
      whereClause = { clientId };
    }

    // Get the schedule
    const schedule = await prisma.workingSchedule.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!schedule) {
      return {
        status: 404,
        message: "לא נמצא לוח זמנים",
      };
    }

    // Generate daily schedule for the month
    const daysInMonth = getDaysInMonth(month, year);
    const dailySchedule = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isWeekendDay = isWeekend(date, schedule.numberOfTotalDaysPerWeek);

      dailySchedule.push({
        date: date.toISOString(),
        dayOfWeek: date.getDay(),
        isWeekend: isWeekendDay,
        scheduleType: isWeekendDay ? "WEEKEND" : "WORKING_DAY",
        startTimeInMinutes: isWeekendDay ? null : schedule.startTimeInMinutes,
        endTimeInMinutes: isWeekendDay ? null : schedule.endTimeInMinutes,
        breakTimeInMinutes: isWeekendDay ? null : schedule.breakTimeInMinutes,
        isBreakTimePaid: isWeekendDay ? null : schedule.isBreakTimePaid,
        totalWorkingHours: isWeekendDay ? 0 : schedule.numberOfTotalHoursPerDay,
        scheduleSource: schedule.source,
      });
    }

    return {
      status: 200,
      message: "לוח הזמנים אוחזר בהצלחה",
      data: {
        schedule,
        dailySchedule,
        metadata: {
          month,
          year,
          totalDays: daysInMonth,
          workingDays: dailySchedule.filter(day => !day.isWeekend).length,
          weekendDays: dailySchedule.filter(day => day.isWeekend).length,
          scheduleSource: schedule.source,
        }
      },
    };
  } catch (error) {
    console.error("שגיאה באחזור לוח הזמנים:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
};

export default getSchedule;
