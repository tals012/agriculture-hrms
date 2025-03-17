"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const workerIdSchema = z.object({
  workerId: z.string({
    required_error: "Worker ID is required"
  })
});

/**
 * Get basic worker details including contact information
 * 
 * @param {Object} params - Query parameters
 * @param {string} params.workerId - The ID of the worker
 * @returns {Promise<{ok: boolean, data?: Object, message?: string}>} Result with worker data
 */
export async function getWorkerDetails(params) {
  try {
    // Validate with Zod
    const { workerId } = workerIdSchema.parse(params);
    
    // Get worker with basic details
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        nameHe: true,
        surnameHe: true,
        primaryPhone: true,
        email: true
      }
    });

    if (!worker) {
      return { ok: false, message: "Worker not found" };
    }

    return { 
      ok: true, 
      data: worker 
    };
  } catch (error) {
    console.error("Error fetching worker details:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 