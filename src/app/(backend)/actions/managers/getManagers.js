"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getManagersSchema = z.object({
  clientId: z.string().optional(),
  search: z.string().optional(),
});

const getManagers = async (filters = {}) => {
  try {
    const parsedFilters = getManagersSchema.safeParse(filters);
    
    if (!parsedFilters.success) {
      const formattedErrors = parsedFilters.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הסינונים שסופקו אינם תקינים",
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
          { email: { contains: parsedFilters.data.search, mode: "insensitive" } },
          { phone: { contains: parsedFilters.data.search, mode: "insensitive" } },
        ],
      });
    }

    const managers = await prisma.manager.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        clientId: true,
        userId: true,
        user: {
          select: {
            username: true,
          },
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
      message: "המנהלים נשלפו בהצלחה",
      data: managers
    };

  } catch (error) {
    console.error("Error fetching managers:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: []
    };
  }
};

export default getManagers;
