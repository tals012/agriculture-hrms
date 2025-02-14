"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getPricingSchema = z.object({
  clientId: z.string().min(1, "נדרש מזהה לקוח"),
  search: z.string().optional(),
});

export const getPricing = async (filters = {}) => {
  try {
    const parsedFilters = getPricingSchema.safeParse(filters);
    
    if (!parsedFilters.success) {
      const formattedErrors = parsedFilters.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: []
      };
    }

    const where = { AND: [] };

    if (parsedFilters.data.clientId) {
      where.AND.push({ clientId: parsedFilters.data.clientId });
    }

    if (parsedFilters.data.search?.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: parsedFilters.data.search, mode: "insensitive" } },
          { species: { name: { contains: parsedFilters.data.search, mode: "insensitive" } } },
          { harvestType: { name: { contains: parsedFilters.data.search, mode: "insensitive" } } },
          { price: { equals: parseFloat(parsedFilters.data.search) || undefined } },
          { containerNorm: { equals: parseFloat(parsedFilters.data.search) || undefined } },
        ],
      });
    }

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
          }
        },
        species: {
          select: {
            id: true,
            name: true,
          }
        },
        groups: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      status: 200,
      message: "תמחורים נשלפו בהצלחה",
      data: pricing
    };

  } catch (error) {
    console.error("Error fetching pricing combinations:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: []
    };
  }
}; 

export default getPricing;