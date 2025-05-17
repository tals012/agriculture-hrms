"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getPricingSchema = z.object({
  groupId: z.string().min(1, "נדרש מזהה קבוצה"),
});

export const getPricing = async (filters = {}) => {
  try {
    const parsedFilters = getPricingSchema.safeParse(filters);

    if (!parsedFilters.success) {
      const formattedErrors = parsedFilters.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "הפילטרים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: [],
      };
    }

    const where = { AND: [] };

    // Skip filtering by groupId to show all pricing combinations
    // if (parsedFilters.data.groupId) {
    //   where.AND.push({ groups: { some: { id: parsedFilters.data.groupId } } });
    // }

    const pricing = await prisma.clientPricingCombination.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        name: true,
        price: true,
        containerNorm: true,
        harvestType: {
          select: {
            id: true,
            name: true,
          },
        },
        species: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: 200,
      message: "צירופי המחירים נטענו בהצלחה",
      data: pricing,
    };
  } catch (error) {
    console.error("שגיאה בטעינת צירופי המחירים:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: [],
    };
  }
};

export default getPricing;
