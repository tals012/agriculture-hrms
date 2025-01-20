"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  fieldId: z.string().min(1, "Field ID is required"),
  managerId: z.string().min(1, "Manager ID is required"),
  workerIds: z.array(z.string()).optional(),
  clientPricingCombinationIds: z.array(z.string()).optional(),
});

export const createGroup = async (input) => {
  try {
    const parsedData = createGroupSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors
      };
    }

    const { name, description, fieldId, managerId, workerIds, clientPricingCombinationIds } = parsedData.data;

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { clientId: true }
    });

    if (!field) {
      return {
        status: 404,
        message: "Field not found"
      };
    }

    const manager = await prisma.manager.findFirst({
      where: { 
        id: managerId,
        clientId: field.clientId
      }
    });

    if (!manager) {
      return {
        status: 404,
        message: "Manager not found or does not belong to this client"
      };
    }

    if (clientPricingCombinationIds?.length > 0) {
      const pricingCombinations = await prisma.clientPricingCombination.findMany({
        where: {
          id: { in: clientPricingCombinationIds },
          clientId: field.clientId
        }
      });

      if (pricingCombinations.length !== clientPricingCombinationIds.length) {
        return {
          status: 404,
          message: "One or more pricing combinations not found or do not belong to this client"
        };
      }
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        fieldId,
        managerId,
        ...(workerIds && {
          workers: {
            connect: workerIds.map(id => ({ id }))
          }
        }),
        ...(clientPricingCombinationIds && {
          clientPricingCombination: {
            connect: clientPricingCombinationIds.map(id => ({ id }))
          }
        })
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
          }
        },
        workers: {
          select: {
            id: true,
          }
        },
        clientPricingCombination: {
          select: {
            id: true,
          }
        }
      }
    });

    return {
      status: 201,
      message: "Group created successfully",
      data: group
    };

  } catch (error) {
    console.error("Error creating group:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
}; 