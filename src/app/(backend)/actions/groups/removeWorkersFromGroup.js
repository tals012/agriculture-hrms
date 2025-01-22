"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  workers: z.array(z.string()).min(1, "Workers are required"),
});

const removeWorkersFromGroup = async (input) => {
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

    await prisma.groupMember.deleteMany({
      where: {
        groupId,
        workerId: { in: workers },
      },
    });

    return {
      status: 200,
      message: "Workers removed from group successfully",
    };
  } catch (error) {
    console.error("Error removing workers from group:", error);
    return {
      status: 500,
      message: "Internal server error",
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default removeWorkersFromGroup;
