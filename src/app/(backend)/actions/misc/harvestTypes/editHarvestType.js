"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const editHarvestTypeSchema = z.object({
  id: z.string().min(1, "נדרש מזהה סוג קציר"),
  name: z.string().min(1, "נדרש שם").max(100, "השם ארוך מדי"),
});

export async function editHarvestType(input) {
  try {
    const { id, name } = editHarvestTypeSchema.parse(input);

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

    const harvestType = await prisma.harvestType.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return { data: harvestType };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error editing harvest type:", error);
    return { error: error.message };
  }
}
