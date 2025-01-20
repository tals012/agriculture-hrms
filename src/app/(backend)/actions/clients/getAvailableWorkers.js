"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getAvailableWorkersSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  search: z.string().optional().nullable(),
});

export const getAvailableWorkers = async (input = {}) => {
  try {
    const parsedData = getAvailableWorkersSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors,
        data: [],
      };
    }

    // Get all workers that are not currently assigned to this client
    const workers = await prisma.worker.findMany({
      where: {
        AND: [
          {
            NOT: {
              clientHistory: {
                some: {
                  clientId: parsedData.data.clientId,
                  endDate: null, // Currently active
                },
              },
            },
          },
          parsedData.data.search
            ? {
                OR: [
                  { nameHe: { contains: parsedData.data.search } },
                  { surnameHe: { contains: parsedData.data.search } },
                  { primaryPhone: { contains: parsedData.data.search } },
                  { passport: { contains: parsedData.data.search } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        nameHe: true,
        surnameHe: true,
        workerStatus: true,
        primaryPhone: true,
        passport: true,
      },
      orderBy: {
        nameHe: "asc",
      },
    });

    return {
      status: 200,
      message: "Available workers fetched successfully",
      data: workers,
    };
  } catch (error) {
    console.error("Error fetching available workers:", error.stack);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: [],
    };
  }
};
