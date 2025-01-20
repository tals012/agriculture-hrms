"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const endWorkerAssignmentSchema = z.object({
  workerId: z.string().min(1, "Worker ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
  endDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
});

export const endWorkerAssignment = async (input) => {
  try {
    const parsedData = endWorkerAssignmentSchema.safeParse(input);

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

    const { workerId, clientId, endDate } = parsedData.data;

    await prisma.$transaction(async (tx) => {
      // Update the worker history record
      await tx.workerClientHistory.updateMany({
        where: {
          workerId,
          clientId,
          endDate: null // Only update currently active assignment
        },
        data: {
          endDate
        }
      });

      // Remove worker's currentClientId
      await tx.worker.update({
        where: { id: workerId },
        data: { currentClientId: null }
      });

      // Disconnect worker from client's currentWorkers
      await tx.client.update({
        where: { id: clientId },
        data: {
          currentWorkers: {
            disconnect: { id: workerId }
          }
        }
      });
    });

    return {
      status: 200,
      message: "Worker assignment ended successfully"
    };

  } catch (error) {
    console.error("Error ending worker assignment:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
}; 