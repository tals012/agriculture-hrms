"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteHarvestTypeSchema = z.object({
  id: z.string().min(1, "נדרש מזהה סוג קציר"),
});

export async function deleteHarvestType(input) {
  try {
    const { id } = deleteHarvestTypeSchema.parse(input);

    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("לא נמצא ארגון");
    }

    const existingHarvestType = await prisma.harvestType.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingHarvestType) {
      throw new Error("סוג הקציר לא נמצא או אין הרשאה");
    }

    const harvests = await prisma.harvest.findFirst({
      where: {
        harvestTypeId: id,
      },
    });

    if (harvests) {
      throw new Error("לא ניתן למחוק סוג קציר שנמצא בשימוש בקצירים");
    }

    const pricingCombinations = await prisma.clientPricingCombination.findFirst({
      where: {
        harvestTypeId: id,
      },
    });

    if (pricingCombinations) {
      throw new Error("לא ניתן למחוק סוג קציר שנמצא בשימוש בתמחורים");
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
