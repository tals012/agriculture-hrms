"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getFieldsSchema = z.object({
  clientId: z.string().optional(),
  search: z.string().optional(),
  managerId: z.string().optional(),
  regionManagerId: z.string().optional(),
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
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: []
      };
    }

    const where = { AND: [] };

    if (parsedFilters.data.clientId) {
      where.AND.push({ clientId: parsedFilters.data.clientId });
    }

    if (parsedFilters.data.managerId) {
      where.AND.push({ managerId: parsedFilters.data.managerId });
    }

    if (parsedFilters.data.regionManagerId) {
      where.AND.push({ regionManagerId: parsedFilters.data.regionManagerId });
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
        name: true,
        typeOfProduct: true,
        contactPhone: true,
        contactPersonName: true,
        address: true,
        status: true,
        createdAt: true,
        city: {
          select: {
            id: true,
            nameInHebrew: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: 200,
      message: "השדות נטענו בהצלחה",
      data: fields,
    };
  } catch (error) {
    console.error("Error fetching fields:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: [],
    };
  }
};

export default getFields;