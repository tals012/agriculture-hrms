"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getClientByIdSchema = z.object({
  clientId: z.string(),
});

const getClientById = async ({ payload }) => {
  try {
    const parsedData = getClientByIdSchema.safeParse(payload);
    if (!parsedData.success) {
      return {
        status: 400,
        message: parsedData.error.errors.map((e) => e.message).join(", "),
        data: null,
      };
    }

    const { clientId } = parsedData.data;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        city: true,
      },
    });
    if (!client) {
      return {
        status: 404,
        message: "Client not found",
        data: null,
      };
    }

    return {
      status: 200,
      message: "Client fetched successfully",
      data: client,
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return {
      status: 500,
      message: "Internal server error",
      data: null,
    };
  }
};

export default getClientById;
