"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  workerId: z.string().min(1, "נדרש מזהה עובד"),
});

const getWorkerNotes = async (input) => {
  try {
    const validatedInput = schema.safeParse(input);

    if (!validatedInput.success) {
      return {
        status: 400,
        message: "הנתונים שהוזנו אינם תקינים",
        errors: validatedInput.error.issues,
        data: null,
      };
    }

    const { workerId } = validatedInput.data;

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        note: true,
      },
    });

    if (!worker) {
      return {
        status: 404,
        message: "העובד לא נמצא",
        data: null,
      };
    }

    return {
      status: 200,
      message: "הערת העובד נטענה בהצלחה",
      data: {
        note: worker.note || "",
      },
    };
  } catch (error) {
    console.error("Error fetching worker notes:", error);
    return {
      status: 500,
      message: "אירעה שגיאה בטעינת הערת העובד",
      error: error.message,
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getWorkerNotes;
