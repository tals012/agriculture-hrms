"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";

const getMonthlySalaryDataSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2100),
  workerId: z.string().optional(),
  groupId: z.string().optional(),
  fieldId: z.string().optional(),
  clientId: z.string().optional(),
});

async function getMonthlySalaryData(input) {
  try {
    // Validate input
    const parsedData = getMonthlySalaryDataSchema.safeParse(input);
    if (!parsedData.success) {
      return {
        status: 400,
        message: "נתונים לא תקינים",
        errors: parsedData.error.issues,
      };
    }

    const { month, year, workerId, groupId, fieldId, clientId } = parsedData.data;

    // Build the date range for the month
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Build worker filter based on input parameters
    const workerFilter = {
      AND: [
        workerId ? { id: workerId } : {},
        groupId ? { 
          groups: { 
            some: { 
              groupId,
              endDate: null 
            } 
          } 
        } : {},
        fieldId ? {
          groups: {
            some: {
              group: {
                fieldId
              }
            }
          }
        } : {},
        clientId ? { currentClientId: clientId } : {},
      ]
    };

    // 1. Get all relevant workers
    const workers = await prisma.worker.findMany({
      where: workerFilter,
      include: {
        groups: {
          where: { endDate: null },
          include: {
            group: {
              include: {
                clientPricingCombination: true
              }
            }
          }
        }
      }
    });

    // Process each worker
    const monthlyData = await Promise.all(workers.map(async (worker) => {
      // 2. Get or create monthly submission
      const monthYear = `${month}/${year}`;
      let monthlySubmission = await prisma.workerMonthlyWorkingHoursSubmission.findUnique({
        where: {
          workerId_monthYear: {
            workerId: worker.id,
            monthYear
          }
        },
        include: {
          dailyCalculations: true
        }
      });

      if (!monthlySubmission) {
        monthlySubmission = await prisma.workerMonthlyWorkingHoursSubmission.create({
          data: {
            workerId: worker.id,
            monthYear,
            firstDayOfMonth: startDate,
            totalDaysInMonth: endDate.getDate(),
            approvalStatus: "PENDING"
          }
        });
      }

      // 3. Get attendance records for the month
      const attendanceRecords = await prisma.workerAttendance.findMany({
        where: {
          workerId: worker.id,
          attendanceDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          combination: true
        },
        orderBy: {
          attendanceDate: 'asc'
        }
      });

      // 4. Calculate or update daily calculations
      const dailyCalculations = await Promise.all(
        attendanceRecords.map(async (attendance) => {
          if (!attendance.combination) return null;

          const calculationDate = new Date(attendance.attendanceDate);
          calculationDate.setUTCHours(0, 0, 0, 0);

          // Calculate windows based on containers filled
          const containersFilled = attendance.totalContainersFilled || 0;
          const containerNorm = attendance.combination.containerNorm || 0;
          const pricePerNorm = attendance.combination.price || 0;

          const window100 = Math.min(containersFilled, containerNorm);
          const window125 = containersFilled > containerNorm 
            ? Math.min(containersFilled - containerNorm, containerNorm * 0.25) 
            : 0;
          const window150 = containersFilled > (containerNorm * 1.25)
            ? containersFilled - (containerNorm * 1.25)
            : 0;

          // Calculate salary and bonus
          const baseSalary = (window100 / containerNorm) * pricePerNorm;
          const bonus125 = (window125 / containerNorm) * pricePerNorm * 1.25;
          const bonus150 = (window150 / containerNorm) * pricePerNorm * 1.5;
          const totalBonus = bonus125 + bonus150;

          // Create or update daily calculation
          return await prisma.workerDailySalaryCalculation.upsert({
            where: {
              workerId_calculationDate: {
                workerId: worker.id,
                calculationDate
              }
            },
            create: {
              workerId: worker.id,
              monthlySubmissionId: monthlySubmission.id,
              calculationDate,
              containersFilled,
              containerNorm,
              pricePerNorm,
              containersWindow100: window100,
              containersWindow125: window125,
              containersWindow150: window150,
              baseSalary,
              totalBonus,
              status: attendance.status,
              attendanceId: attendance.id,
              combinationId: attendance.combinationId
            },
            update: {
              containersFilled,
              containerNorm,
              pricePerNorm,
              containersWindow100: window100,
              containersWindow125: window125,
              containersWindow150: window150,
              baseSalary,
              totalBonus,
              status: attendance.status
            }
          });
        })
      );

      // 5. Calculate monthly totals
      const validCalculations = dailyCalculations.filter(Boolean);
      const monthlyTotals = validCalculations.reduce((acc, calc) => ({
        totalContainersFilled: acc.totalContainersFilled + calc.containersFilled,
        containersWindow100: acc.containersWindow100 + calc.containersWindow100,
        containersWindow125: acc.containersWindow125 + calc.containersWindow125,
        containersWindow150: acc.containersWindow150 + calc.containersWindow150,
        totalBaseSalary: acc.totalBaseSalary + calc.baseSalary,
        totalBonus: acc.totalBonus + calc.totalBonus,
      }), {
        totalContainersFilled: 0,
        containersWindow100: 0,
        containersWindow125: 0,
        containersWindow150: 0,
        totalBaseSalary: 0,
        totalBonus: 0,
      });

      // Calculate status counts
      const statusCounts = attendanceRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});

      // 6. Update monthly submission
      await prisma.workerMonthlyWorkingHoursSubmission.update({
        where: { id: monthlySubmission.id },
        data: {
          ...monthlyTotals,
          workingDays: statusCounts.WORKING || 0,
          sickDays: statusCounts.SICK_LEAVE || 0,
          holidayDays: statusCounts.HOLIDAY || 0,
          absentDays: statusCounts.ABSENT || 0,
          dayOffDays: statusCounts.DAY_OFF || 0,
          interVisaDays: statusCounts.INTER_VISA || 0,
          accidentDays: statusCounts.ACCIDENT || 0,
          personalDays: statusCounts.DAY_OFF_PERSONAL_REASON || 0,
          attendancePercentage: ((statusCounts.WORKING || 0) / endDate.getDate()) * 100
        }
      });

      return {
        worker: {
          id: worker.id,
          name: worker.nameHe,
        },
        ...monthlyTotals,
        statusCounts,
        attendancePercentage: ((statusCounts.WORKING || 0) / endDate.getDate()) * 100
      };
    }));

    return {
      status: 200,
      message: "נתוני השכר אוחזרו בהצלחה",
      data: monthlyData
    };

  } catch (error) {
    console.error("Error fetching monthly salary data:", error);
    return {
      status: 500,
      message: "שגיאה בשליחת הנתונים",
      error: error.message
    };
  }
}

export default getMonthlySalaryData;