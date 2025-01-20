"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteHarvestTypeSchema = z.object({
  id: z.string().min(1, "Harvest Type ID is required"),
});

export async function deleteHarvestType(input) {
  try {
    const { id } = deleteHarvestTypeSchema.parse(input);

    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("No organization found");
    }

    const existingHarvestType = await prisma.harvestType.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingHarvestType) {
      throw new Error("Harvest type not found or unauthorized");
    }

    const harvests = await prisma.harvest.findFirst({
      where: {
        harvestTypeId: id,
      },
    });

    if (harvests) {
      throw new Error("Cannot delete harvest type that is being used in harvests");
    }

    const pricingCombinations = await prisma.clientPricingCombination.findFirst({
      where: {
        harvestTypeId: id,
      },
    });

    if (pricingCombinations) {
      throw new Error("Cannot delete harvest type that is being used in pricing combinations");
    }

    await prisma.harvestType.delete({
      where: {
        id,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error deleting harvest type:", error);
    return { error: error.message };
  }
}
