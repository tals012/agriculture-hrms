/**
 * API Route: Process Salary System Batch
 * 
 * This endpoint processes a batch of worker submissions for the salary system.
 * It handles multiple workers in parallel and manages the processing state.
 * 
 * Endpoint: POST /api/salary/send-to-salary-system/process-batch
 * Body: { 
 *   workerSubmissionIdsBatch: string[],
 *   date: { month: number, year: number }
 * }
 */

import { NextResponse } from "next/server";
import { processSingleWorkerSalary } from "./processSingleWorkerSalary";

export const maxDuration = 300;

export async function POST(req) {
  try {
    const body = await req.json();
    const { workerSubmissionIdsBatch, date } = body;

    if (!Array.isArray(workerSubmissionIdsBatch)) {
      return NextResponse.json(
        { message: "נתונים לא תקינים" },
        { status: 400 }
      );
    }

    // Process all workers in parallel
    const submissionPromises = workerSubmissionIdsBatch.map(
      async (submissionId) => {
        try {
          return await processSingleWorkerSalary({
            workerSubmissionsId: submissionId,
            date
          });
        } catch (error) {
          console.error(`Error processing worker submission ${submissionId}:`, error);
          return {
            ok: false,
            submissionId,
            error: error.message
          };
        }
      }
    );

    const results = await Promise.all(submissionPromises);
    
    // Count successes and failures
    const summary = results.reduce(
      (acc, result) => {
        if (result.ok) {
          acc.success++;
        } else {
          acc.failed++;
          if (result.submissionId) {
            acc.failedIds.push(result.submissionId);
          }
        }
        return acc;
      },
      { success: 0, failed: 0, failedIds: [] }
    );

    return NextResponse.json({
      message: `עובדו ${summary.success} עובדים בהצלחה${
        summary.failed > 0 ? `, נכשלו ${summary.failed} עובדים` : ""
      }`,
      summary
    });

  } catch (error) {
    console.error("Error processing batch:", error);
    return NextResponse.json(
      { message: "שגיאה בעיבוד נתוני השכר" },
      { status: 500 }
    );
  }
} 