"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const assignFieldSchema = z.object({
  managerId: z.string().min(1, "Manager ID is required"),
  fieldId: z.string().min(1, "Field ID is required"),
});

const assignField = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "No payload provided",
        data: null,
      };
    }

    const parsedData = assignFieldSchema.safeParse(payload);
    
    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "Validation failed",
        errors: formattedErrors,
        data: null,
      };
    }

    const manager = await prisma.manager.findUnique({
      where: { id: parsedData.data.managerId },
    });

    if (!manager) {
      return {
        status: 404,
        message: "Manager not found",
        data: null,
      };
    }

    const field = await prisma.field.findUnique({
      where: { id: parsedData.data.fieldId },
    });

    if (!field) {
      return {
        status: 404,
        message: "Field not found",
        data: null,
      };
    }

    const updatedField = await prisma.field.update({
      where: { id: parsedData.data.fieldId },
      data: { managerId: parsedData.data.managerId },
      select: {
        id: true,
        name: true,
        manager: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return {
      status: 200,
      message: "Field assigned successfully",
      data: updatedField,
    };

  } catch (error) {
    console.error("Error assigning field:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: null,
    };
  }
}; 

export default assignField;