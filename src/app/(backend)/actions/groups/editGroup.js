"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const editGroupSchema = z.object({
  id: z.string().min(1, "נדרש מזהה קבוצה"),
  name: z.string().min(1, "נדרש שם"),
  description: z.string().optional(),
  fieldId: z.string().min(1, "נדרש מזהה שדה"),
});

export const editGroup = async (input) => {
  try {
    const parsedData = editGroupSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors
      };
    }

    const { id, name, description, fieldId } = parsedData.data;

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        field: {
          select: { clientId: true }
        }
      }
    });

    if (!existingGroup) {
      return {
        status: 404,
        message: "הקבוצה לא נמצאה"
      };
    }

    // Check if field exists and belongs to the client
    const field = await prisma.field.findFirst({
      where: { 
        id: fieldId,
        clientId: existingGroup.field.clientId
      }
    });

    if (!field) {
      return {
        status: 404,
        message: "השדה לא נמצא או לא שייך ללקוח זה"
      };
    }

    // Update the group
    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
        fieldId,
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    });

    return {
      status: 200,
      message: "הקבוצה עודכנה בהצלחה",
      data: group
    };

  } catch (error) {
    console.error("Error updating group:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message
    };
  }
}; 