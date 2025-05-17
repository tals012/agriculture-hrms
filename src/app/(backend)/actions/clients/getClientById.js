"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getClientByIdSchema = z.object({
  clientId: z.string().min(1, "נדרש מזהה לקוח"),
});

const getClientById = async (payload) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = getClientByIdSchema.safeParse(payload);

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

    const client = await prisma.client.findUnique({
      where: { id: parsedData.data.clientId },
    });

    if (!client) {
      return {
        status: 404,
        message: "הלקוח לא נמצא",
        data: null,
      };
    }

    return {
      status: 200,
      message: "לקוח נמצא בהצלחה",
      data: client,
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  }
};

export default getClientById;
