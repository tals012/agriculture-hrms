"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const getWorkingScheduleSchema = z.object({
  workerId: z.string(),
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

export async function getWorkingSchedule(input) {
  try {
    const parsedData = getWorkingScheduleSchema.safeParse(input);

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

    const { workerId, month, year } = parsedData.data;

    // * Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return {
        status: 404,
        message: "Organization not found",
      };
    }

    // * Get worker with their groups and current client
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },

      include: {
        groups: {
          include: {
            group: {
              include: {
                field: true
              }
            }
          }
        },
        currentClient: true
      }
    });

    if (!worker) {
      return {
        status: 404,
        message: "Worker not found",
      };
    }

    // * Get worker's attendance records for the specified month
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59)); // ! Last day of the month
    
    const attendanceRecords = await prisma.workerAttendance.findMany({
      where: {
        workerId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        combination: {
          include: {
            harvestType: true,
            species: true,
          }
        }
      },
      orderBy: {
        attendanceDate: 'asc',
      },
    });

    // * Create a map of attendance records by date for easy lookup
    const attendanceByDate = new Map(
      attendanceRecords.map(record => {
        // ! Normalize the date to YYYY-MM-DD format in UTC
        const date = new Date(record.attendanceDate);
        const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        return [utcDate.toISOString().split('T')[0], record];
      })
    );

    // * Calculate attendance statistics
    const attendanceStats = attendanceRecords.reduce((stats, record) => {
      if (!record.isWeekend) {
        stats.totalContainers += record.totalContainersFilled || 0;
        stats.totalHours += record.totalHoursWorked || 0;
        stats.totalHours100 += record.totalHoursWorkedWindow100 || 0;
        stats.totalHours125 += record.totalHoursWorkedWindow125 || 0;
        stats.totalHours150 += record.totalHoursWorkedWindow150 || 0;

        if (record.combination) {
          const key = `${record.combination.harvestType.name}-${record.combination.species.name}`;
          if (!stats.byProduct[key]) {
            stats.byProduct[key] = {
              harvestType: record.combination.harvestType.name,
              species: record.combination.species.name,
              containers: 0,
            };
          }
          stats.byProduct[key].containers += record.totalContainersFilled || 0;
        }
      }
      return stats;
    }, { 
      totalContainers: 0, 
      totalHours: 0,
      totalHours100: 0,
      totalHours125: 0,
      totalHours150: 0,
      byProduct: {} 
    });

    // * Get the working schedule following the priority system
    let schedule;

    // & Priority 1: Check worker's personal schedule
    schedule = await prisma.workingSchedule.findFirst({
      where: { workerId },
      orderBy: { createdAt: 'desc' }
    });

    if (schedule) {
      console.log("Found worker's personal schedule");
    } else {
      // & Priority 2: Check schedule from worker's current group
      const currentGroup = worker.groups.find(membership => !membership.endDate);
      if (currentGroup) {
        schedule = await prisma.workingSchedule.findFirst({
          where: { groupId: currentGroup.groupId },
          orderBy: { createdAt: 'desc' }
        });

        if (schedule) {
          console.log("Found schedule from worker's current group");
        }
      }

      if (!schedule) {
        // & Priority 3: Check schedules from worker's fields
        const fieldIds = [...new Set(worker.groups.map(membership => membership.group.field?.id).filter(Boolean))];
        schedule = await prisma.workingSchedule.findFirst({
          where: { fieldId: { in: fieldIds } },
          orderBy: { createdAt: 'desc' }
        });

        if (schedule) {
          console.log("Found schedule from worker's field");
        } else {
          // & Priority 4: Check client's schedule
          if (worker.currentClientId) {
            schedule = await prisma.workingSchedule.findFirst({
              where: { clientId: worker.currentClientId },
              orderBy: { createdAt: 'desc' }
            });

            if (schedule) {
              console.log("Found client's schedule");
            }
          }

          // & Priority 5: Fall back to organization schedule
          if (!schedule) {
            schedule = await prisma.workingSchedule.findFirst({
              where: { organizationId: organization.id },
              orderBy: { createdAt: 'desc' }
            });

            if (schedule) {
              console.log("Found organization's schedule");
            }
          }
        }
      }
    }

    if (!schedule) {
      return {
        status: 404,
        message: "No schedule found for this worker at any level (personal, group, field, client, or organization)",
      };
    }

    // * Generate daily schedule for the month
    const daysInMonth = getDaysInMonth(month, year);
    const dailySchedule = [];

    for (let day = 1; day <= daysInMonth; day++) {
      // & Create date in UTC to match the attendance records
      const date = new Date(Date.UTC(year, month - 1, day));
      const dateString = date.toISOString().split('T')[0];
      const attendanceRecord = attendanceByDate.get(dateString);

      if (attendanceRecord) {
        // & Use actual attendance record
        dailySchedule.push({
          date: date.toISOString(),
          dayOfWeek: date.getDay(),
          isWeekend: attendanceRecord.status === 'WEEKEND',
          scheduleType: attendanceRecord.status,
          startTimeInMinutes: attendanceRecord.startTimeInMinutes,
          endTimeInMinutes: attendanceRecord.endTimeInMinutes,
          breakTimeInMinutes: attendanceRecord.breakTimeInMinutes,
          isBreakTimePaid: attendanceRecord.isBreakTimePaid,
          totalWorkingHours: attendanceRecord.totalHoursWorked,
          scheduleSource: 'ATTENDANCE',
          status: attendanceRecord.status,
          totalContainersFilled: attendanceRecord.totalContainersFilled,
          totalWorkingHoursWindow100: attendanceRecord.totalHoursWorkedWindow100,
          totalWorkingHoursWindow125: attendanceRecord.totalHoursWorkedWindow125,
          totalWorkingHoursWindow150: attendanceRecord.totalHoursWorkedWindow150,
          combination: attendanceRecord.combination ? {
            harvestType: attendanceRecord.combination.harvestType.name,
            species: attendanceRecord.combination.species.name,
            price: attendanceRecord.combination.price,
            containerNorm: attendanceRecord.combination.containerNorm,
          } : null,

        });
      } else {
        // & Use planned schedule
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
          totalWorkingHoursWindow100: isWeekendDay ? 0 : schedule.numberOfTotalHoursPerDayWindow100,
          totalWorkingHoursWindow125: isWeekendDay ? 0 : schedule.numberOfTotalHoursPerDayWindow125,
          totalWorkingHoursWindow150: isWeekendDay ? 0 : schedule.numberOfTotalHoursPerDayWindow150,
          scheduleSource: schedule.source,
        });
      }

    }

    return {
      status: 200,
      message: "Schedule retrieved successfully",
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
          hasAttendanceRecords: attendanceRecords.length > 0,
          attendance: attendanceRecords.length > 0 ? {
            totalRecords: attendanceRecords.length,
            totalContainers: attendanceStats.totalContainers,
            totalHours: attendanceStats.totalHours,
            totalHours100: attendanceStats.totalHours100,
            totalHours125: attendanceStats.totalHours125,
            totalHours150: attendanceStats.totalHours150,
            byProduct: Object.values(attendanceStats.byProduct),
          } : null,
        }
      },
    };
  } catch (error) {
    console.error("Error retrieving working schedule:", error.stack);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
}

export default getWorkingSchedule;
