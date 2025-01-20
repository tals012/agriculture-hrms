"use server";

import prisma from "@/lib/prisma";

export async function getHarvestTypes() {
  try {
    const organization = await prisma.organization.findFirst({
      select: { id: true },
    });

    if (!organization) {
      throw new Error("No organization found");
    }

    const harvestTypes = await prisma.harvestType.findMany({
      where: {
        organizationId: organization.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: harvestTypes };
  } catch (error) {
    console.error("Error getting harvest types:", error);
    return { error: error.message };
  }
}
