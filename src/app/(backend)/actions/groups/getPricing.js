"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getPricingSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
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
        message: "Invalid filters provided",
        errors: formattedErrors,
        data: []
      };
    }

    const where = { AND: [] };

    if (parsedFilters.data.groupId) {
      where.AND.push({ groups: { some: { id: parsedFilters.data.groupId } } });
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      status: 200,
      message: "Pricing combinations fetched successfully",
      data: pricing
    };

  } catch (error) {
    console.error("Error fetching pricing combinations:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: []
    };
  }
}; 

export default getPricing;