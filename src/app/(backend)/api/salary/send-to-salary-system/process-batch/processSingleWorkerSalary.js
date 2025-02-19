"use server";

import prisma from "@/lib/prisma";
import { sendDetailsToSalarySystem } from "./sendDetailsToSalarySystem";

export async function processSingleWorkerSalary({ workerSubmissionsId, date }) {
  try {
    // Get the submission with worker details
    const submission = await prisma.workerMonthlyWorkingHoursSubmission.findUnique({
      where: {
        id: workerSubmissionsId,
      },
      include: {
        worker: {
          include: {
            country: true,
            city: true,
            user: true,
            currentClient: true,
          }
        }
      }
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.isSentToSalarySystem) {
      return {
        ok: false,
        message: "השכר כבר נשלח למערכת השכר"
      };
    }

    // Get attendance records for the month
    const attendanceRecords = await prisma.workerAttendance.findMany({
      where: {
        workerId: submission.workerId,
        attendanceDate: {
          gte: submission.firstDayOfMonth,
          lt: new Date(submission.firstDayOfMonth.getFullYear(), submission.firstDayOfMonth.getMonth() + 1, 1)
        }
      },
      include: {
        combination: true
      },
      orderBy: {
        attendanceDate: 'asc'
      }
    });

    // Send data to salary system
    const result = await sendDetailsToSalarySystem({
      workerSubmissionsId,
      date,
      attendanceRecords
    });

    if (!result.ok) {
      // Update submission status to failed
      await prisma.workerMonthlyWorkingHoursSubmission.update({
        where: { id: workerSubmissionsId },
        data: {
          isSentToSalarySystem: false,
          approvalStatus: "REJECTED"
        }
      });

      return {
        ok: false,
        message: result.message || "שגיאה בשליחת נתוני השכר"
      };
    }

    // Update submission status to success
    await prisma.workerMonthlyWorkingHoursSubmission.update({
      where: { id: workerSubmissionsId },
      data: {
        isSentToSalarySystem: true,
        approvalStatus: "APPROVED"
      }
    });

    return {
      ok: true,
      message: "נתוני השכר נשלחו בהצלחה"
    };

  } catch (error) {
    console.error("Error processing worker salary:", error);
    
    // Update submission status to failed
    await prisma.workerMonthlyWorkingHoursSubmission.update({
      where: { id: workerSubmissionsId },
      data: {
        isSentToSalarySystem: false,
        approvalStatus: "REJECTED"
      }
    });

    return {
      ok: false,
      message: "שגיאה בעיבוד נתוני השכר"
    };
  }
} 