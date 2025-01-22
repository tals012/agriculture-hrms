"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteGroupSchema = z.object({
  id: z.string().min(1, "Group ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

export const deleteGroup = async (input) => {
  try {
    const parsedData = deleteGroupSchema.safeParse(input);

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

    const { id, clientId } = parsedData.data;

    // Check if group exists and belongs to the client
    const group = await prisma.group.findFirst({
      where: { 
        id,
        field: {
          clientId
        }
      },
      include: {
        clientPricingCombination: {
          select: { id: true }
        }
      }
    });

    if (!group) {
      return {
        status: 404,
        message: "Group not found or does not belong to this client"
      };
    }

    // Check if group is being used in any pricing combinations
    // if (group.clientPricingCombination.length > 0) {
    //   return {
    //     status: 400,
    //     message: "Cannot delete group as it is being used in pricing combinations"
    //   };
    // }

    // Delete the group
    await prisma.group.delete({
      where: { id }
    });

    return {
      status: 200,
      message: "Group deleted successfully"
    };

  } catch (error) {
    console.error("Error deleting group:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
}; 