"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
});

const getAvailableWorkers = async (input) => {
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
      select: { field: { select: { clientId: true } } },
    });

    const clientId = group.field.clientId;

    const workers = await prisma.worker.findMany({
      where: {
        currentClientId: clientId,
        NOT: { groups: { some: { groupId } } },
      },
    });
    
    return {
      status: 200,
      message: "העובדים הזמינים נשלפו בהצלחה",
      data: workers,
    };
  } catch (error) {
    console.error("שגיאה בשליפת העובדים הזמינים:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getAvailableWorkers;
