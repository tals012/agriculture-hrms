"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  managerId: z.string().min(1, "Manager ID is required"),
});

const getManagerGroupMembers = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "נתונים לא תקינים",
        errors: parsedData.error.issues,
      };
    }

    const { managerId } = parsedData.data;

    const groupMembers = await prisma.groupMember.findMany({
      where: {
        group: {
          field: {
            managerId,
          },
        },
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            nameHe: true,
            passport: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            field: {
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
      message: "חברי הקבוצה נשלפו בהצלחה",
      data: groupMembers,
    };
  } catch (error) {
    console.error("שגיאה בשליפת חברי הקבוצה:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getManagerGroupMembers;
