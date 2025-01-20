"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const assignWorkersSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  workerIds: z.array(z.string()).min(1, "At least one worker must be selected"),
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
        message: "Invalid data provided",
        errors: formattedErrors
      };
    }

    const { clientId, workerIds, startDate, note } = parsedData.data;

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        workerIds.map(workerId =>
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
      
      await Promise.all(
        workerIds.map(workerId =>
          tx.worker.update({
            where: { id: workerId },
            data: { currentClientId: clientId }
          })
        )
      );

      await tx.client.update({
        where: { id: clientId },
        data: {
          currentWorkers: {
            connect: workerIds.map(id => ({ id }))
          }
        }
      });
    });

    return {
      status: 201,
      message: "Workers assigned successfully"
    };

  } catch (error) {
    console.error("Error assigning workers:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
}; 