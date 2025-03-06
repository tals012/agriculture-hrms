"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
});

const getGroupById = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "נתונים לא תקינים",
        errors: parsedData.error.issues,
      };
    }

    const { groupId } = parsedData.data;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        field: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      status: 200,
      message: "קבוצה נשלפה בהצלחה",
      data: group,
    };
  } catch (error) {
    console.error("Error fetching group:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getGroupById;
