/**
 * API Route: Send Salary Data to External System
 * 
 * This endpoint processes and sends worker salary data to the external salary system.
 * It handles validation, batch processing, and status updates.
 * 
 * Endpoint: POST /api/salary/send-to-salary-system
 * Body: { 
 *   month: number,
 *   year: number,
 *   selectedWorkerIds: string[]
 * }
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";
import { waitUntil } from "@vercel/functions";
import getMonthlySalaryData from "@/app/(backend)/actions/salary/getMonthlySalaryData";

dayjs.extend(utc);
dayjs.extend(timezone);

// Validation schema
const validatePayload = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2100),
  selectedWorkerIds: z.array(z.string()).min(1)
});

// Set maximum duration for the API route (5 minutes)
export const maxDuration = 300;

export async function POST(req) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedData = validatePayload.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "נתונים לא תקינים", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { month, year, selectedWorkerIds } = validatedData.data;

    // Get salary data for selected workers
    const salaryData = await getMonthlySalaryData({
      month,
      year,
      workerId: selectedWorkerIds.length === 1 ? selectedWorkerIds[0] : undefined,
      workerIds: selectedWorkerIds.length > 1 ? selectedWorkerIds : undefined
    });

    if (salaryData.status !== 200) {
      return NextResponse.json(
        { message: salaryData.message || "שגיאה בטעינת נתוני השכר" },
        { status: 400 }
      );
    }

    const monthYear = dayjs()
      .tz("Asia/Jerusalem")
      .set("year", year)
      .set("month", month - 1)
      .format("MM/YYYY");

    // Track created and updated submission IDs
    const submissionIds = [];

    // Process each worker's data
    for (const worker of salaryData.data) {
      const submission = await prisma.workerMonthlyWorkingHoursSubmission.upsert({
        where: {
          workerId_monthYear: {
            workerId: worker.worker.id,
            monthYear
          }
        },
        create: {
          workerId: worker.worker.id,
          monthYear,
          firstDayOfMonth: dayjs().tz("Asia/Jerusalem").set("year", year).set("month", month - 1).startOf("month").toDate(),
          totalContainersFilled: worker.totalContainers,
          totalBaseSalary: worker.totalBaseSalary,
          totalSalary: worker.totalSalary,
          totalBonus: worker.bonus,
          workingDays: worker.workedDays,
          sickDays: worker.sickDays,
          totalMonthlyHours100: worker.totalHours100,
          totalMonthlyHours125: worker.totalHours125,
          totalMonthlyHours150: worker.totalHours150,
          isSentToSalarySystem: false,
          approvalStatus: "PENDING"
        },
        update: {
          totalContainersFilled: worker.totalContainers,
          totalBaseSalary: worker.totalBaseSalary,
          totalSalary: worker.totalSalary,
          totalBonus: worker.bonus,
          workingDays: worker.workedDays,
          sickDays: worker.sickDays,
          totalMonthlyHours100: worker.totalHours100,
          totalMonthlyHours125: worker.totalHours125,
          totalMonthlyHours150: worker.totalHours150,
          isSentToSalarySystem: false,
          approvalStatus: "PENDING"
        }
      });

      submissionIds.push(submission.id);
    }

    // Process submissions in batches
    const batchSize = 20;
    waitUntil(
      (async () => {
        for (let i = 0; i < submissionIds.length; i += batchSize) {
          const batch = submissionIds.slice(i, i + batchSize);
          await sendBatchForProcessing({
            workerSubmissionIdsBatch: batch,
            date: { month, year }
          });
        }
        return Promise.resolve(true);
      })()
    );

    return NextResponse.json(
      { message: "הנתונים נשלחו בהצלחה למערכת השכר" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error sending salary data:", error);
    return NextResponse.json(
      { message: "שגיאה בשליחת נתוני השכר" },
      { status: 500 }
    );
  }
}

async function sendBatchForProcessing({ workerSubmissionIdsBatch, date }) {
  try {
    const response = await fetch("/api/salary/send-to-salary-system/process-batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ workerSubmissionIdsBatch, date })
    });

    return response.ok;
  } catch (error) {
    console.error("Error processing batch:", error);
    return false;
  }
} 