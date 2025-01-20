"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getGroupsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  fieldId: z.string().optional(),
  search: z.string().optional(),
});

export const getGroups = async (input) => {
  try {
    const parsedData = getGroupsSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors,
        data: []
      };
    }

    const { clientId, fieldId, search } = parsedData.data;

    // Build the where clause
    const where = {
      field: {
        clientId
      }
    };

    // Add field filter if provided
    if (fieldId) {
      where.fieldId = fieldId;
    }

    // Add search filter if provided
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        field: {
          select: {
            id: true,
            name: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
          }
        },
        workers: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      status: 200,
      message: "Groups fetched successfully",
      data: groups
    };

  } catch (error) {
    console.error("Error fetching groups:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: []
    };
  }
}; 