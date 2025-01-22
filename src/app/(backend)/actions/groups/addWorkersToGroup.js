"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  workers: z.array(z.string()).min(1, "Workers are required"),
});

const addWorkersToGroup = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "Invalid data provided",
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
      message: "Workers added to group successfully",
    };
    
  } catch (error) {
    console.error("Error adding workers to group:", error);
    return {
      status: 500,
      message: "Internal server error",
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default addWorkersToGroup;
