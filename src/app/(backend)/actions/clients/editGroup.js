"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const editGroupSchema = z.object({
  id: z.string().min(1, "Group ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  fieldId: z.string().min(1, "Field ID is required"),
  managerId: z.string().min(1, "Manager ID is required"),
  workerIds: z.array(z.string()).optional(),
});

export const editGroup = async (input) => {
  try {
    const parsedData = editGroupSchema.safeParse(input);

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

    const { id, name, description, fieldId, managerId, workerIds } = parsedData.data;

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        field: {
          select: { clientId: true }
        }
      }
    });

    if (!existingGroup) {
      return {
        status: 404,
        message: "Group not found"
      };
    }

    // Check if field exists and belongs to the client
    const field = await prisma.field.findFirst({
      where: { 
        id: fieldId,
        clientId: existingGroup.field.clientId
      }
    });

    if (!field) {
      return {
        status: 404,
        message: "Field not found or does not belong to this client"
      };
    }

    // Check if manager exists and belongs to the client
    const manager = await prisma.manager.findFirst({
      where: { 
        id: managerId,
        clientId: existingGroup.field.clientId
      }
    });

    if (!manager) {
      return {
        status: 404,
        message: "Manager not found or does not belong to this client"
      };
    }

    // Update the group
    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
        fieldId,
        managerId,
        ...(workerIds && {
          workers: {
            set: workerIds.map(id => ({ id }))
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
        }
      }
    });

    return {
      status: 200,
      message: "Group updated successfully",
      data: group
    };

  } catch (error) {
    console.error("Error updating group:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
}; 