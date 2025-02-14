"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const assignWorkersSchema = z.object({
  clientId: z.string().min(1, "נדרש מזהה לקוח"),
  workerIds: z.array(z.string()).min(1, "חובה לבחור לפחות עובד אחד"),
  startDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  note: z.string().optional(),
});

export const assignWorkers = async (input) => {
  try {
    const parsedData = assignWorkersSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors
      };
    }

    const { clientId, workerIds, startDate, note } = parsedData.data;

    // Process workers in smaller chunks to avoid timeouts
    const CHUNK_SIZE = 10;
    for (let i = 0; i < workerIds.length; i += CHUNK_SIZE) {
      const chunk = workerIds.slice(i, i + CHUNK_SIZE);
      
      await prisma.$transaction(async (tx) => {
        // Create history records for the chunk
        await Promise.all(
          chunk.map(workerId =>
            tx.workerClientHistory.create({
              data: {
                workerId,
                clientId,
                startDate,
                note: note || null
              }
            })
          )
        );
        
        // Update workers in the chunk
        await Promise.all(
          chunk.map(workerId =>
            tx.worker.update({
              where: { id: workerId },
              data: { currentClientId: clientId }
            })
          )
        );

        // Update client for the chunk
        await tx.client.update({
          where: { id: clientId },
          data: {
            currentWorkers: {
              connect: chunk.map(id => ({ id }))
            }
          }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });
    }

    return {
      status: 201,
      message: "העובדים הוקצו בהצלחה"
    };

  } catch (error) {
    console.error("שגיאה בהקצאת עובדים:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message
    };
  }
}; 