"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getFieldsSchema = z.object({
  clientId: z.string().optional(),
  search: z.string().optional(),
});

const getFields = async (filters = {}) => {
  try {
    const parsedFilters = getFieldsSchema.safeParse(filters);
    
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

    if (parsedFilters.data.clientId) {
      where.AND.push({ clientId: parsedFilters.data.clientId });
    }

    if (parsedFilters.data.search?.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: parsedFilters.data.search, mode: "insensitive" } },
          { typeOfProduct: { contains: parsedFilters.data.search, mode: "insensitive" } },
          { contactPhone: { contains: parsedFilters.data.search, mode: "insensitive" } },
          { contactPersonName: { contains: parsedFilters.data.search, mode: "insensitive" } },
          { address: { contains: parsedFilters.data.search, mode: "insensitive" } },
        ],
      });
    }

    const fields = await prisma.field.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        serialNumber: true,
        name: true,
        typeOfProduct: true,
        contactPhone: true,
        contactPersonName: true,
        additionalPhone: true,
        withholdingAccountNumber: true,
        address: true,
        fieldTax: true,
        fieldCode: true,
        size: true,
        status: true,
        latitude: true,
        longitude: true,
        fieldOpenTime: true,
        fieldCloseTime: true,
        note: true,
        cityId: true,
        city: {
          select: {
            nameInHebrew: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
          }
        },
        harvests: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    return {
      status: 200,
      message: "Fields fetched successfully",
      data: fields
    };

  } catch (error) {
    console.error("Error fetching fields:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: []
    };
  }
}; 

export default getFields;