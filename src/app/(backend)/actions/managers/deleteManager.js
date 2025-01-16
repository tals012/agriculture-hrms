"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteManagerSchema = z.object({
  managerId: z.string().min(1, "Manager ID is required"),
});

const deleteManager = async ({ payload }) => {
  try {
    // Validate payload exists
    if (!payload) {
      return {
        status: 400,
        message: "No payload provided",
        data: null,
      };
    }

    // Validate the payload
    const parsedData = deleteManagerSchema.safeParse(payload);
    
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

    // Check if manager exists
    const managerExists = await prisma.manager.findUnique({
      where: { id: parsedData.data.managerId },
      include: {
        groups: true,
      },
    });

    if (!managerExists) {
      return {
        status: 404,
        message: "Manager not found",
        data: null,
      };
    }

    // Delete the manager and associated groups (cascade delete will handle this)
    await prisma.manager.delete({
      where: { id: parsedData.data.managerId },
    });

    return {
      status: 200,
      message: "Manager deleted successfully",
      data: null,
    };

  } catch (error) {
    console.error("Error deleting manager:", error);
    
    if (error.code === 'P2025') {
      return {
        status: 404,
        message: "Manager not found or already deleted",
        data: null,
      };
    }

    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: null,
    };
  }
};

export default deleteManager; 