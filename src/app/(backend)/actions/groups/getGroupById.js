"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  groupId: z.string().min(1, "נדרש מזהה קבוצה"),
});

const getGroupById = async (input) => {
  try {
    const validatedInput = schema.safeParse(input);

    if (!validatedInput.success) {
      return {
        status: 400,
        message: "הנתונים שהוזנו אינם תקינים",
        errors: validatedInput.error.issues,
      };
    }

    const { groupId } = validatedInput.data;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        field: true,
        members: {
          include: {
            worker: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return {
        status: 404,
        message: "הקבוצה לא נמצאה",
      };
    }

    return {
      status: 200,
      message: "הקבוצה נטענה בהצלחה",
      data: group,
    };
  } catch (error) {
    console.error("Error fetching group:", error);
    return {
      status: 500,
      message: "אירעה שגיאה בטעינת נתוני הקבוצה",
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getGroupById;
