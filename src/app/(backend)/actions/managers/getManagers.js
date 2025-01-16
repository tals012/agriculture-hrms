"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getManagersSchema = z.object({
  clientId: z.string().optional(),
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
        message: "Invalid filters provided",
        errors: formattedErrors,
        data: []
      };
    }

    const where = {};
    if (parsedFilters.data.clientId) {
      where.clientId = parsedFilters.data.clientId;
    }

    const managers = await prisma.manager.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        groups: {
          select: {
            id: true,
            groupName: true,
            schedule: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      status: 200,
      message: "Managers fetched successfully",
      data: managers
    };

  } catch (error) {
    console.error("Error fetching managers:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: []
    };
  }
};

export default getManagers;
