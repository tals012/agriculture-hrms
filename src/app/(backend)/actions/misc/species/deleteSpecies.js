"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteSpeciesSchema = z.object({
  id: z.string().min(1, "Species ID is required"),
});

export async function deleteSpecies(input) {
  try {
    const { id } = deleteSpeciesSchema.parse(input);

    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("No organization found");
    }

    const existingSpecies = await prisma.species.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingSpecies) {
      throw new Error("Species not found or unauthorized");
    }

    const harvests = await prisma.harvest.findFirst({
      where: {
        speciesId: id,
      },
    });

    if (harvests) {
      throw new Error("Cannot delete species that is being used in harvests");
    }

    const pricingCombinations = await prisma.clientPricingCombination.findFirst({
      where: {
        speciesId: id,
      },
    });

    if (pricingCombinations) {
      throw new Error("Cannot delete species that is being used in pricing combinations");
    }

    await prisma.species.delete({
      where: {
        id,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error deleting species:", error);
    return { error: error.message };
  }
}
