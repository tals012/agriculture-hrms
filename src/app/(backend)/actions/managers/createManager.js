"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createManagerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

const createManager = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "No payload provided",
        data: null,
      };
    }

    const parsedData = createManagerSchema.safeParse(payload);
    
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

    const clientExists = await prisma.client.findUnique({
      where: { id: parsedData.data.clientId },
    });

    if (!clientExists) {
      return {
        status: 404,
        message: "Client not found",
        data: null,
      };
    }

    const existingManager = await prisma.manager.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingManager) {
      return {
        status: 409,
        message: "Email already in use",
        data: null,
      };
    }

    const newManager = await prisma.manager.create({
      data: parsedData.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      status: 201,
      message: "Manager created successfully",
      data: newManager,
    };

  } catch (error) {
    console.error("Error creating manager:", error);
    
    if (error.code === 'P2002') {
      return {
        status: 409,
        message: "A unique constraint would be violated. The email might already be in use.",
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

export default createManager; 