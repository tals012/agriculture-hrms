"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const assignGroupSchema = z.object({
  managerId: z.string().min(1, "Manager ID is required"),
  groupId: z.string().min(1, "Group ID is required"),
});

const assignGroup = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = assignGroupSchema.safeParse(payload);

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

    const manager = await prisma.manager.findUnique({
      where: { id: parsedData.data.managerId },
    });

    if (!manager) {
      return {
        status: 404,
        message: "המנהל לא נמצא",
        data: null,
      };
    }

    const group = await prisma.group.findUnique({
      where: { id: parsedData.data.groupId },
    });

    if (!group) {
      return {
        status: 404,
        message: "הקבוצה לא נמצאה",
        data: null,
      };
    }

    const updatedGroup = await prisma.group.update({
      where: { id: parsedData.data.groupId },
      data: { managerId: parsedData.data.managerId },
      select: {
        id: true,
        name: true,
        manager: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return {
      status: 200,
      message: "הקבוצה הוקצתה בהצלחה",
      data: updatedGroup,
    };

  } catch (error) {
    console.error("Error assigning group:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
};

export default assignGroup;
