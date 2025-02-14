"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
});

const getGroupMembers = async (input) => {
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

    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        worker: true,
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
    console.error("Error fetching group members:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getGroupMembers;
