"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  workerId: z.string().min(1, "Worker ID is required"),
});

const makeGroupLeader = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "Invalid data provided",
        errors: parsedData.error.issues,
      };
    }

    const { groupId, workerId } = parsedData.data;

    await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new Error("Group not found");
      }

      const worker = await tx.worker.findUnique({
        where: { id: workerId },
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      await tx.groupMember.updateMany({
        where: {
          groupId,
          isGroupLeader: true,
        },
        data: {
          isGroupLeader: false,
        },
      });

      const existingMember = group.members.find(
        (member) => member.workerId === workerId
      );

      if (existingMember) {
        await tx.groupMember.update({
          where: { id: existingMember.id },
          data: {
            isGroupLeader: true,
          },
        });
      } else {
        await tx.groupMember.create({
          data: {
            groupId,
            workerId,
            isGroupLeader: true,
            startDate: new Date(),
          },
        });
      }
    });

    return {
      status: 200,
      message: "Group leader updated successfully",
    };
  } catch (error) {
    console.error("Error updating group leader:", error);
    return {
      status: 500,
      message: error.message || "Internal server error",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default makeGroupLeader;
