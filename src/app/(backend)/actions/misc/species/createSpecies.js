"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createSpeciesSchema = z.object({
  name: z.string().min(1, "נדרש שם").max(100, "השם ארוך מדי"),
});

export async function createSpecies(input) {
  try {
    const { name } = createSpeciesSchema.parse(input);

    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("לא נמצא ארגון");
    }

    const species = await prisma.species.create({
      data: {
        name,
        organizationId: organization.id,
      },
    });

    return { data: species };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error creating species:", error);
    return { error: error.message };
  }
}
