"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createHarvestTypeSchema = z.object({
  name: z.string().min(1, "נדרש שם").max(100, "השם ארוך מדי"),
});

export async function createHarvestType(input) {
  try {
    const { name } = createHarvestTypeSchema.parse(input);

    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("לא נמצא ארגון");
    }

    const harvestType = await prisma.harvestType.create({
      data: {
        name,
        organizationId: organization.id,
      },
    });

    return { data: harvestType };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error creating harvest type:", error);
    return { error: error.message };
  }
}
