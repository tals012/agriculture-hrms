"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  groupId: z.string().min(1, "נדרש מזהה קבוצה"),
  workers: z.array(z.string()).min(1, "נדרשים עובדים"),
});

const addWorkersToGroup = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: parsedData.error.issues,
      };
    }

    const { groupId, workers } = parsedData.data;

    await prisma.groupMember.createMany({
      data: workers.map((worker) => ({
        groupId,
        workerId: worker,
      })),
    });

    return {
      status: 200,
      message: "העובדים נוספו לקבוצה בהצלחה",
    };
    
  } catch (error) {
    console.error("Error adding workers to group:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default addWorkersToGroup;
