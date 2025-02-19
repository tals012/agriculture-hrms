"use server";

import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import axios from "axios";
import https from "https";
import { calculateSalaryWithBonus, calculateSalaryWithoutBonus, formatSalaryForExternalSystem } from "@/lib/utils/salaryCalculation";
import { getOrganizationSettings } from "../settings/getOrganizationSettings";

export async function sendDetailsToSalarySystem(workerSubmissionId, date) {
  try {
    // * Get organization settings for bonus calculation
    const orgSettings = await getOrganizationSettings();
    if (orgSettings.status !== 200) {
      throw new Error("לא נמצאו הגדרות ארגון");
    }

    // * Get worker submission details
    const submission = await prisma.workerMonthlyWorkingHoursSubmission.findUnique({
      where: { id: workerSubmissionId },
      include: {
        worker: {
          include: {
            country: true,
            city: true,
            user: true,
            currentClient: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error("לא נמצאו נתוני הגשה");
    }

    if (submission.sentToSalarySystem) {
      return {
        status: 200,
        message: "הנתונים כבר נשלחו למערכת השכר",
      };
    }

    // * Get attendance records for the month
    const attendanceRecords = await prisma.workerAttendance.findMany({
      where: {
        workerId: submission.workerId,
        attendanceDate: {
          gte: dayjs(`${date.year}-${date.month}-01`).toDate(),
          lt: dayjs(`${date.year}-${date.month}-01`).add(1, "month").toDate(),
        },
      },
    });

    // Calculate total hours from attendance records
    const totalHours = attendanceRecords.reduce((acc, record) => ({
      totalHours100: acc.totalHours100 + (record.totalHoursWorkedWindow100 || 0),
      totalHours125: acc.totalHours125 + (record.totalHoursWorkedWindow125 || 0),
      totalHours150: acc.totalHours150 + (record.totalHoursWorkedWindow150 || 0),
    }), {
      totalHours100: 0,
      totalHours125: 0,
      totalHours150: 0,
    });

    // Format salary data for external system
    const salaryData = formatSalaryForExternalSystem({
      hours100: totalHours.totalHours100,
      hours125: totalHours.totalHours125,
      hours150: totalHours.totalHours150,
      isBonusPaid: orgSettings.data.isBonusPaid,
    });

    // * Prepare data for salary system
    const baseMASKORET = {
      PASSPORT: submission.worker.passportNumber,
      COUNTRY: submission.worker.country.nameEn,
      CITY: submission.worker.city.nameEn,
      FIRST_NAME: submission.worker.nameEn.split(" ")[0],
      LAST_NAME: submission.worker.nameEn.split(" ").slice(1).join(" "),
      MONTH: date.month,
      YEAR: date.year,
      REGULAR_HOURS: salaryData.regularHours,
      OVERTIME_HOURS: salaryData.overtimeHours,
      REGULAR_RATE: salaryData.regularRate,
      OVERTIME_RATE: salaryData.overtimeRate,
      TOTAL_SALARY: salaryData.totalSalary,
      CLIENT_NAME: submission.worker.currentClient?.nameEn || "",
    };

    // * Send data to salary system
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios.post(
      process.env.SALARY_SYSTEM_API_URL,
      baseMASKORET,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SALARY_SYSTEM_API_KEY}`,
        },
        httpsAgent: agent,
      }
    );

    if (response.status === 200) {
      // * Update submission status
      await prisma.workerMonthlyWorkingHoursSubmission.update({
        where: { id: workerSubmissionId },
        data: {
          sentToSalarySystem: true,
          sentToSalarySystemAt: new Date(),
          status: "APPROVED",
        },
      });

      return {
        status: 200,
        message: "הנתונים נשלחו בהצלחה למערכת השכר",
      };
    } else {
      throw new Error("שגיאה בשליחת הנתונים למערכת השכר");
    }
  } catch (error) {
    console.error("Error sending details to salary system:", error);

    // * Update submission status to rejected
    await prisma.workerMonthlyWorkingHoursSubmission.update({
      where: { id: workerSubmissionId },
      data: {
        status: "REJECTED",
        rejectionReason: error.message,
      },
    });

    return {
      status: 500,
      message: "שגיאה בשליחת הנתונים למערכת השכר",
      error: error.message,
    };
  }
} 