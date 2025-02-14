"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getWorkerHistorySchema = z.object({
  clientId: z.string().min(1, "נדרש מזהה לקוח"),
  search: z.string().optional(),
});

export const getWorkerHistory = async (input = {}) => {
  try {
    const parsedData = getWorkerHistorySchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: [],
      };
    }

    const workerHistory = await prisma.workerClientHistory.findMany({
      where: {
        clientId: parsedData.data.clientId,
      },
      include: {
        worker: {
          select: {
            nameHe: true,
            surnameHe: true,
            workerStatus: true,
            primaryPhone: true,
            passport: true,
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return {
      status: 200,
      message: "ההשתתפות בפרוייקט נשלפה בהצלחה",
      data: workerHistory
    };

  } catch (error) {
    console.error("Error fetching worker history:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: []
    };
  }
}; 