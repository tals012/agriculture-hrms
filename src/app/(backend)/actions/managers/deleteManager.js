"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteManagerSchema = z.object({
  managerId: z.string().min(1, "נדרש מזהה מנהל"),
});

const deleteManager = async (payload) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = deleteManagerSchema.safeParse(payload);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "אימות נכשל",
        errors: formattedErrors,
        data: null,
      };
    }

    const manager = await prisma.manager.findUnique({
      where: { id: parsedData.data.managerId },
      select: {
        userId: true,
      },
    });

    if (!manager) {
      return {
        status: 404,
        message: "המנהל לא נמצא",
        data: null,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.manager.delete({
        where: { id: parsedData.data.managerId },
      });

      if (manager.userId) {
        await tx.user.delete({
          where: { id: manager.userId },
        });
      }
    });

    return {
      status: 200,
      message: "המנהל וחשבון המשתמש המשויך נמחקו בהצלחה",
      data: null,
    };
  } catch (error) {
    console.error("Error deleting manager:", error);

    if (error.code === "P2025") {
      return {
        status: 404,
        message: "המנהל לא נמצא או כבר נמחק",
        data: null,
      };
    }

    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
};

export default deleteManager;
