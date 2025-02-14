"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteFieldSchema = z.object({
  fieldId: z.string().min(1, "נדרש מזהה שדה"),
});

const deleteField = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = deleteFieldSchema.safeParse(payload);
    
    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "אימות נכשל",
        errors: formattedErrors,
        data: null,
      };
    }

    const fieldExists = await prisma.field.findUnique({
      where: { id: parsedData.data.fieldId },
      include: {
        harvests: true,
      },
    });

    if (!fieldExists) {
      return {
        status: 404,
        message: "השדה לא נמצא",
        data: null,
      };
    }

    await prisma.field.delete({
      where: { id: parsedData.data.fieldId },
    });

    return {
      status: 200,
      message: "השדה נמחק בהצלחה",
      data: null,
    };

  } catch (error) {
    console.error("Error deleting field:", error);
    
    if (error.code === 'P2025') {
      return {
        status: 404,
        message: "השדה לא נמצא או כבר נמחק",
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

export default deleteField;