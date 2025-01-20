"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createPricingSchema = z.object({
  name: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  containerNorm: z.number().min(0, "Container norm must be a positive number").optional(),
  harvestTypeId: z.string().min(1, "Harvest type is required"),
  speciesId: z.string().min(1, "Species is required"),
  clientId: z.string().min(1, "Client is required"),
});

const createPricing = async (input) => {
  try {
    const parsedData = createPricingSchema.safeParse(input);

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

    const harvestType = await prisma.harvestType.findUnique({
      where: { id: parsedData.data.harvestTypeId }
    });

    if (!harvestType) {
      return {
        status: 404,
        message: "Harvest type not found",
      };
    }

    const species = await prisma.species.findUnique({
      where: { id: parsedData.data.speciesId }
    });

    if (!species) {
      return {
        status: 404,
        message: "Species not found",
      };
    }

    const client = await prisma.client.findUnique({
      where: { id: parsedData.data.clientId }
    });

    if (!client) {
      return {
        status: 404,
        message: "Client not found",
      };
    }

    const existingCombination = await prisma.clientPricingCombination.findFirst({
      where: {
        harvestTypeId: parsedData.data.harvestTypeId,
        speciesId: parsedData.data.speciesId,
        clientId: parsedData.data.clientId,
      }
    });

    if (existingCombination) {
      return {
        status: 400,
        message: "A pricing combination with these parameters already exists",
      };
    }

    const pricing = await prisma.clientPricingCombination.create({
      data: {
        name: parsedData.data.name,
        price: parsedData.data.price,
        containerNorm: parsedData.data.containerNorm,
        harvestTypeId: parsedData.data.harvestTypeId,
        speciesId: parsedData.data.speciesId,
        clientId: parsedData.data.clientId,
      },
      include: {
        harvestType: {
          select: {
            id: true,
            name: true,
          }
        },
        species: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    });

    return {
      status: 201,
      message: "Pricing combination created successfully",
      data: pricing
    };

  } catch (error) {
    console.error("Error creating pricing combination:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message
    };
  }
};

export default createPricing;
