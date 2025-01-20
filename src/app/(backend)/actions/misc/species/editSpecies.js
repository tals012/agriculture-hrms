"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const editSpeciesSchema = z.object({
  id: z.string().min(1, "Species ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export async function editSpecies(input) {
  try {
    const { id, name } = editSpeciesSchema.parse(input);

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

    const species = await prisma.species.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return { data: species };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error editing species:", error);
    return { error: error.message };
  }
}
