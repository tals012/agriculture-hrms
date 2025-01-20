"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deletePricingSchema = z.object({
  id: z.string().min(1, "Pricing ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

const deletePricing = async (input) => {
  try {
    const parsedData = deletePricingSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors,
      };
    }

    const existingPricing = await prisma.clientPricingCombination.findFirst({
      where: {
        id: parsedData.data.id,
        clientId: parsedData.data.clientId,
      }
    });

    if (!existingPricing) {
      return {
        status: 404,
        message: "Pricing combination not found or doesn't belong to the client",
      };
    }

    await prisma.clientPricingCombination.delete({
      where: {
        id: parsedData.data.id,
      }
    });

    return {
      status: 200,
      message: "Pricing combination deleted successfully",
    };

  } catch (error) {
    console.error("Error deleting pricing combination:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
};

export default deletePricing;
