"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getAvailableWorkersSchema = z.object({
  clientId: z.string().min(1, "נדרש מזהה לקוח"),
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
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: [],
      };
    }

    // Get workers that are not currently assigned to any client
    const workers = await prisma.worker.findMany({
      where: {
        AND: [
          {
            // No active client assignments
            NOT: {
              clientHistory: {
                some: {
                  endDate: null, // Currently active assignment
                },
              },
            },
          },
          // Worker should be in ACTIVE status
          {
            workerStatus: "ACTIVE",
          },
          // Search filter if provided
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
      orderBy: [
        { nameHe: "asc" },
        { surnameHe: "asc" },
      ],
    });

    return {
      status: 200,
      message: "העובדים הזמינים נטענו בהצלחה",
      data: workers,
    };
  } catch (error) {
    console.error("Error fetching available workers:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: [],
    };
  }
};

