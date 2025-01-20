"use server";

import prisma from "@/lib/prisma";

export async function getSpecies() {
  try {
    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("No organization found");
    }

    const species = await prisma.species.findMany({
      where: {
        organizationId: organization.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: species };
  } catch (error) {
    console.error("Error getting species:", error);
    return { error: error.message };
  }
}
