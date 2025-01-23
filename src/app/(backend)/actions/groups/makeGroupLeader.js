"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

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
          members: {
            include: {
              worker: {
                include: {
                  user: true
                }
              }
            }
          },
        },
      });

      if (!group) {
        throw new Error("Group not found");
      }

      const worker = await tx.worker.findUnique({
        where: { id: workerId },
        include: {
          user: true
        }
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      const currentLeaders = group.members.filter(member => member.isGroupLeader);
      for (const leader of currentLeaders) {
        if (leader.worker.userId) {
          await tx.user.delete({
            where: { id: leader.worker.userId }
          });
        }
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

      if (!worker.userId) {
        const organization = await tx.organization.findFirst();
        if (!organization) {
          throw new Error("No organization exists");
        }

        const firstName = (worker.name || worker.nameHe || "user").split(' ')[0].toLowerCase();
        let username = firstName;
        let counter = 1;
        while (true) {
          const existingUser = await tx.user.findUnique({
            where: { username }
          });
          if (!existingUser) break;
          username = `${firstName}${counter}`;
          counter++;
        }

        const hashedPassword = await bcrypt.hash("systempassword123", SALT_ROUNDS);

        const user = await tx.user.create({
          data: {
            name: worker.name || worker.nameHe || "",
            username,
            email: worker.email || `${username}@system.local`,
            password: hashedPassword,
            phone: worker.primaryPhone,
            role: "GROUP_LEADER",
            organizationId: organization.id,
          },
        });

        await tx.worker.update({
          where: { id: workerId },
          data: { userId: user.id }
        });
      }

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
