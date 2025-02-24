"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  calculateSalaryWithBonus,
  calculateSalaryWithoutBonus,
} from "@/lib/utils/salaryCalculation";
import { getOrganizationSettings } from "../settings/getOrganizationSettings";

const getMonthlySalaryDataSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2100),
  workerId: z.string().optional(),
  workerIds: z.array(z.string()).optional(),
  groupId: z.string().optional(),
  fieldId: z.string().optional(),
  clientId: z.string().optional(),
});

async function getMonthlySalaryData(input) {
  try {
    // * Validate input
    const parsedData = getMonthlySalaryDataSchema.safeParse(input);
    if (!parsedData.success) {
      return {
        status: 400,
        message: "נתונים לא תקינים",
        errors: parsedData.error.issues,
      };
    }

    // * Get organization settings for bonus calculation
    const orgSettings = await getOrganizationSettings();
    if (orgSettings.status !== 200) {
      return orgSettings;
    }

    const { month, year, workerId, groupId, fieldId, clientId, workerIds } =
      parsedData.data;

    // * Build the date range for the month
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // * Build worker filter based on input parameters
    const workerFilter = {
      AND: [
        workerId ? { id: workerId } : {},
        workerIds ? { id: { in: workerIds } } : {},
        groupId
          ? {
              groups: {
                some: {
                  groupId,
                  endDate: null,
                },
              },
            }
          : {},
        fieldId
          ? {
              groups: {
                some: {
                  group: {
                    fieldId,
                  },
                },
              },
            }
          : {},
        clientId ? { currentClientId: clientId } : {},
      ],
    };

    // * 1. Get all relevant workers
    const workers = await prisma.worker.findMany({
      where: workerFilter,
      include: {
        groups: {
          where: { endDate: null },
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

    // * Process each worker
    const monthlyData = await Promise.all(
      workers.map(async (worker) => {
        // * 2. Get or create monthly submission
        const monthYear = `${month}/${year}`;
        let monthlySubmission =
          await prisma.workerMonthlyWorkingHoursSubmission.findUnique({
            where: {
              workerId_monthYear: {
                workerId: worker.id,
                monthYear,
              },
            },
            include: {
              dailyCalculations: true,
            },
          });

        if (!monthlySubmission) {
          monthlySubmission =
            await prisma.workerMonthlyWorkingHoursSubmission.create({
              data: {
                workerId: worker.id,
                monthYear,
                firstDayOfMonth: startDate,
                totalDaysInMonth: endDate.getDate(),
                approvalStatus: "PENDING",
              },
            });
        }

        // * 3. Get attendance records for the month
        const attendanceRecords = await prisma.workerAttendance.findMany({
          where: {
            workerId: worker.id,
            attendanceDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            combination: true,
          },
          orderBy: {
            attendanceDate: "asc",
          },
        });

        // * 4. Calculate or update daily calculations
        const dailyCalculations = await Promise.all(
          attendanceRecords.map(async (attendance) => {
            // if (!attendance.combination) return null;

            const calculationDate = new Date(attendance.attendanceDate);
            calculationDate.setUTCHours(0, 0, 0, 0);

            const containersFilled = attendance.totalContainersFilled || 0;
            const containerNorm = attendance.combination.containerNorm || 0;
            const pricePerNorm = attendance.combination.price || 0;
            const totalHoursWorkedWindow100 =
              attendance.totalHoursWorkedWindow100 || 0;
            const totalHoursWorkedWindow125 =
              attendance.totalHoursWorkedWindow125 || 0;
            const totalHoursWorkedWindow150 =
              attendance.totalHoursWorkedWindow150 || 0;

            // const window100 = Math.min(containersFilled, containerNorm);
            // const window125 = containersFilled > containerNorm
            //   ? Math.min(containersFilled - containerNorm, containerNorm * 0.25)
            //   : 0;
            // const window150 = containersFilled > (containerNorm * 1.25)
            //   ? containersFilled - (containerNorm * 1.25)
            //   : 0;
            // const baseSalary = (window100 / containerNorm) * pricePerNorm;
            // const bonus125 = (window125 / containerNorm) * pricePerNorm * 1.25;
            // const bonus150 = (window150 / containerNorm) * pricePerNorm * 1.5;
            // const totalBonus = bonus125 + bonus150;

            // const baseSalary = orgSettings.data.isBonusPaid

            // * calculate containers filled in each window
            const containersWindow100 = Math.min(
              containersFilled,
              containerNorm
            );
            const containersWindow125 =
              containersFilled > containerNorm
                ? Math.min(
                    containersFilled - containerNorm,
                    containerNorm * 0.25
                  )
                : 0;
            const containersWindow150 =
              containersFilled > containerNorm * 1.25
                ? containersFilled - containerNorm * 1.25
                : 0;

            // * calculate base salary and total bonus if bonus is paid
            const dailySalaryCalculation = orgSettings.data.isBonusPaid
              ? calculateSalaryWithBonus({
                  hours100: totalHoursWorkedWindow100,
                  hours125: totalHoursWorkedWindow125,
                  hours150: totalHoursWorkedWindow150,
                })
              : calculateSalaryWithoutBonus({
                  hours100: totalHoursWorkedWindow100,
                  hours125: totalHoursWorkedWindow125,
                  hours150: totalHoursWorkedWindow150,
                });

            const baseSalary = dailySalaryCalculation.regularHoursValue;
            const totalBonus = orgSettings.data.isBonusPaid
              ? dailySalaryCalculation.overtimeHoursValue
              : 0;
            const totalSalary = dailySalaryCalculation.total;
            const hours125Salary = dailySalaryCalculation.hours125Value;
            const hours150Salary = dailySalaryCalculation.hours150Value;

            // * Create or update daily calculation
            return await prisma.workerDailySalaryCalculation.upsert({
              where: {
                workerId_calculationDate: {
                  workerId: worker.id,
                  calculationDate,
                },
              },
              create: {
                workerId: worker.id,
                monthlySubmissionId: monthlySubmission.id,
                calculationDate,
                containersFilled,
                containerNorm,
                pricePerNorm,
                containersWindow100,
                containersWindow125,
                containersWindow150,
                baseSalary,
                totalBonus,
                totalSalary,
                hours125Salary,
                hours150Salary,
                status: attendance.status,
                attendanceId: attendance.id,
                combinationId: attendance.combinationId,
              },
              update: {
                containersFilled,
                containerNorm,
                pricePerNorm,
                containersWindow100,
                containersWindow125,
                containersWindow150,
                baseSalary,
                totalBonus,
                totalSalary,
                hours125Salary,
                hours150Salary,
                status: attendance.status,
              },
              include: {
                attendance: true,
              },
            });
          })
        );

        // * 5. Calculate monthly totals
        const validCalculations = dailyCalculations.filter(Boolean);
        const monthlyTotals = validCalculations.reduce(
          (acc, calc) => ({
            totalContainersFilled:
              acc.totalContainersFilled + calc.containersFilled,
            containersWindow100:
              acc.containersWindow100 + calc.containersWindow100,
            containersWindow125:
              acc.containersWindow125 + calc.containersWindow125,
            containersWindow150:
              acc.containersWindow150 + calc.containersWindow150,
            totalBaseSalary: acc.totalBaseSalary + calc.baseSalary,
            totalBonus: acc.totalBonus + calc.totalBonus,
            totalSalary: acc.totalSalary + calc.totalSalary,
            hours125Salary: acc.hours125Salary + calc.hours125Salary,
            hours150Salary: acc.hours150Salary + calc.hours150Salary,
            totalHoursWorked:
              acc.totalHoursWorked + calc.attendance?.totalHoursWorked,
            totalMonthlyHours100:
              acc.totalMonthlyHours100 +
              (calc.attendance?.totalHoursWorkedWindow100 || 0),
            totalMonthlyHours125:
              acc.totalMonthlyHours125 +
              (calc.attendance?.totalHoursWorkedWindow125 || 0),
            totalMonthlyHours150:
              acc.totalMonthlyHours150 +
              (calc.attendance?.totalHoursWorkedWindow150 || 0),
          }),
          {
            totalContainersFilled: 0,
            containersWindow100: 0,
            containersWindow125: 0,
            containersWindow150: 0,
            totalBaseSalary: 0,
            totalBonus: 0,
            totalSalary: 0,
            hours125Salary: 0,
            hours150Salary: 0,
            totalHoursWorked: 0,
            totalMonthlyHours100: 0,
            totalMonthlyHours125: 0,
            totalMonthlyHours150: 0,
          }
        );

        // Calculate total hours from attendance records
        // const totalHours = attendanceRecords.reduce(
        //   (acc, record) => ({
        //     totalHours100:
        //       acc.totalHours100 + (record.totalHoursWorkedWindow100 || 0),
        //     totalHours125:
        //       acc.totalHours125 + (record.totalHoursWorkedWindow125 || 0),
        //     totalHours150:
        //       acc.totalHours150 + (record.totalHoursWorkedWindow150 || 0),
        //   }),
        //   {
        //     totalHours100: 0,
        //     totalHours125: 0,
        //     totalHours150: 0,
        //   }
        // );

        // Calculate salary based on bonus setting
        // const salaryCalculation = orgSettings.data.isBonusPaid
        //   ? calculateSalaryWithBonus({
        //       hours100: totalHours.totalHours100,
        //       hours125: totalHours.totalHours125,
        //       hours150: totalHours.totalHours150,
        //     })
        //   : calculateSalaryWithoutBonus({
        //       hours100: totalHours.totalHours100,
        //       hours125: totalHours.totalHours125,
        //       hours150: totalHours.totalHours150,
        //     });

        const {
          totalContainersFilled,
          containersWindow100,
          containersWindow125,
          containersWindow150,
          totalBaseSalary,
          totalBonus,
          totalSalary,
          hours125Salary,
          hours150Salary,
          totalHoursWorked,
          totalMonthlyHours100,
          totalMonthlyHours125,
          totalMonthlyHours150,
        } = monthlyTotals;

        // Calculate status counts
        const statusCounts = attendanceRecords.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {});

        // * Update monthly submission with new calculations
        await prisma.workerMonthlyWorkingHoursSubmission.update({
          where: { id: monthlySubmission.id },
          data: {
            // ! MONTHLY WORKING HOURS
            totalMonthlyHours: totalHoursWorked,
            totalMonthlyHours100,
            totalMonthlyHours125,
            totalMonthlyHours150,

            // ! MONTHLY CONTAINERS
            totalContainersFilled,
            containersWindow100,
            containersWindow125,
            containersWindow150,

            // ! MONTHLY SALARY
            totalBaseSalary,
            totalBonus,
            totalSalary,
            totalHours125Salary: hours125Salary,
            totalHours150Salary: hours150Salary,

            // ! STATUS COUNTS
            workingDays: statusCounts.WORKING || 0,
            sickDays: statusCounts.SICK_LEAVE || 0,
            holidayDays: statusCounts.HOLIDAY || 0,
            absentDays: statusCounts.ABSENT || 0,
            dayOffDays: statusCounts.DAY_OFF || 0,
            interVisaDays: statusCounts.INTER_VISA || 0,
            accidentDays: statusCounts.ACCIDENT || 0,
            personalDays: statusCounts.DAY_OFF_PERSONAL_REASON || 0,

            // ! ATTENDANCE PERCENTAGE (NOT NECESSARY FOR NOW)
            attendancePercentage:
              ((statusCounts.WORKING || 0) / endDate.getDate()) * 100,
          },
        });

        return {
          worker: {
            id: worker.id,
            name: worker.nameHe,
          },
          totalContainers: totalContainersFilled,

          totalBaseSalary,
          totalSalary,
          bonus: totalBonus,
          totalHours125Salary: hours125Salary,
          totalHours150Salary: hours150Salary,

          workedDays: statusCounts.WORKING || 0,
          sickDays: statusCounts.SICK_LEAVE || 0,
          totalHours100: totalMonthlyHours100,
          totalHours125: totalMonthlyHours125,
          totalHours150: totalMonthlyHours150,
        };
      })
    );

    return {
      status: 200,
      message: "נתוני השכר אוחזרו בהצלחה",
      data: monthlyData,
    };
  } catch (error) {
    console.error("Error fetching monthly salary data:", error);
    return {
      status: 500,
      message: "שגיאה בשליחת הנתונים",
      error: error.message,
    };
  }
}

export default getMonthlySalaryData;
