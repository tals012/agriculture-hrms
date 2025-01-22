"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  fieldId: z.string().min(1, "Field ID is required"),
  workerIds: z.array(z.string()).optional(),
  leaderWorkerId: z.string().optional(),
  clientPricingCombinationIds: z.array(z.string()).optional(),
});

export const createGroup = async (input) => {
  try {
    const parsedData = createGroupSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors,
      };
    }

    const {
      name,
      description,
      fieldId,
      workerIds,
      clientPricingCombinationIds,
      leaderWorkerId,
    } = parsedData.data;

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { clientId: true },
    });

    if (!field) {
      return {
        status: 404,
        message: "Field not found",
      };
    }

    if (clientPricingCombinationIds?.length > 0) {
      const pricingCombinations =
        await prisma.clientPricingCombination.findMany({
          where: {
            id: { in: clientPricingCombinationIds },
            clientId: field.clientId,
          },
        });

      if (pricingCombinations.length !== clientPricingCombinationIds.length) {
        return {
          status: 404,
          message:
            "One or more pricing combinations not found or do not belong to this client",
        };
      }
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        fieldId,
        ...(clientPricingCombinationIds && {
          clientPricingCombination: {
            connect: clientPricingCombinationIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
        clientPricingCombination: {
          select: {
            id: true,
          },
        },
      },
    });

    if (workerIds?.length > 0) {
      await prisma.groupMember.createMany({
        data: workerIds.map((id) => ({
          groupId: group.id,
          workerId: id,
          isGroupLeader: false,
          startDate: new Date(),
        })),
      });
    }

    if (leaderWorkerId) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          workerId: leaderWorkerId,
          isGroupLeader: true,
          startDate: new Date(),
        },
      });
    }

    return {
      status: 201,
      message: "Group created successfully",
      data: group,
    };
  } catch (error) {
    console.error("Error creating group:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
};
