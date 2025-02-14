"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deletePricingSchema = z.object({
  pricingId: z.string().min(1, "נדרש מזהה תמחור"),
});

const deletePricing = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = deletePricingSchema.safeParse(payload);
    
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

    const pricing = await prisma.clientPricingCombination.findUnique({
      where: { id: parsedData.data.pricingId },
    });

    if (!pricing) {
      return {
        status: 404,
        message: "התמחור לא נמצא",
        data: null,
      };
    }

    await prisma.clientPricingCombination.delete({
      where: {
        id: parsedData.data.pricingId,
      }
    });

    return {
      status: 200,
      message: "התמחור נמחק בהצלחה",
    };

  } catch (error) {
    console.error("Error deleting pricing combination:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message
    };
  }
};

export default deletePricing;
