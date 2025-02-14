"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteGroupSchema = z.object({
  id: z.string().min(1, "Group ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

export const deleteGroup = async (input) => {
  try {
    const parsedData = deleteGroupSchema.safeParse(input);

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

    const { id, clientId } = parsedData.data;

    // Check if group exists and belongs to the client
    const group = await prisma.group.findFirst({
      where: { 
        id,
        field: {
          clientId
        }
      },
      include: {
        clientPricingCombination: {
          select: { id: true }
        }
      }
    });

    if (!group) {
      return {
        status: 404,
        message: "הקבוצה לא נמצאה או לא שייכת ללקוח זה"
      };
    }

    // Check if group is being used in any pricing combinations
    // if (group.clientPricingCombination.length > 0) {
    //   return {
    //     status: 400,
    //     message: "לא ניתן למחוק את הקבוצה מכיוון שהיא בשימוש בשילובי תמחור"
    //   };
    // }

    // Delete the group
    await prisma.group.delete({
      where: { id }
    });

    return {
      status: 200,
      message: "הקבוצה נמחקה בהצלחה"
    };

  } catch (error) {
    console.error("שגיאה במחיקת הקבוצה:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message
    };
  }
}; 