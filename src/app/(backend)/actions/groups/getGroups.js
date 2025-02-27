"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getGroupsSchema = z.object({
  clientId: z.string().optional(),
  fieldId: z.string().optional(),
  search: z.string().optional(),
  managerId: z.string().optional(),
  leaderId: z.string().optional(),
});

const getGroups = async (input) => {
  try {
    const parsedData = getGroupsSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: [],
      };
    }

    const { clientId, fieldId, search, managerId, leaderId } = parsedData.data;

    const where = {};

    if (clientId) {
      where.field = {
        clientId,
      };
    }

    if (fieldId) {
      where.fieldId = fieldId;
    }

    if (managerId) {
      where.field = {
        ...where.field,
        managerId,
      };
    }

    if (leaderId) {
      where.members = {
        some: {
          workerId: leaderId,
          isGroupLeader: true,
        },
      };
    }

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          select: {
            id: true,
            workerId: true,
            startDate: true,
            endDate: true,
            worker: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: 200,
      message: "הקבוצות נטענו בהצלחה",
      data: groups,
    };
  } catch (error) {
    console.error("Error fetching groups:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: [],
    };
  }
};

export default getGroups;
