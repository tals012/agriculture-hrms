"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteSpeciesSchema = z.object({
  id: z.string().min(1, "נדרש מזהה זן"),
});

export async function deleteSpecies(input) {
  try {
    const { id } = deleteSpeciesSchema.parse(input);

    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("לא נמצא ארגון");
    }

    const existingSpecies = await prisma.species.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingSpecies) {
      throw new Error("הזן לא נמצא או אין הרשאה");
    }

    const harvests = await prisma.harvest.findFirst({
      where: {
        speciesId: id,
      },
    });

    if (harvests) {
      throw new Error("לא ניתן למחוק זן שנמצא בשימוש בקצירים");
    }

    const pricingCombinations = await prisma.clientPricingCombination.findFirst({
      where: {
        speciesId: id,
      },
    });

    if (pricingCombinations) {
      throw new Error("לא ניתן למחוק זן שנמצא בשימוש בתמחורים");
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
