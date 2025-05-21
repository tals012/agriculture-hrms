"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const assignFieldSchema = z.object({
  regionManagerId: z.string().min(1, "Manager ID is required"),
  fieldId: z.string().min(1, "Field ID is required"),
});

const assignFieldToRegionManager = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = assignFieldSchema.safeParse(payload);
    
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

    const manager = await prisma.regionManager.findUnique({
      where: { id: parsedData.data.regionManagerId },
    });

    if (!manager) {
      return {
        status: 404,
        message: "מנהל האזור לא נמצא",
        data: null,
      };
    }

    const field = await prisma.field.findUnique({
      where: { id: parsedData.data.fieldId },
    });

    if (!field) {
      return {
        status: 404,
        message: "השדה לא נמצא",
        data: null,
      };
    }

    const updatedField = await prisma.field.update({
      where: { id: parsedData.data.fieldId },
      data: { regionManagerId: parsedData.data.regionManagerId },
      select: {
        id: true,
        name: true,
        regionManager: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return {
      status: 200,
      message: "השדה הוקצה בהצלחה",
      data: updatedField,
    };

  } catch (error) {
    console.error("Error assigning field:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
}; 

export default assignFieldToRegionManager;
