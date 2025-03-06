"use server";

import prisma from "@/lib/prisma";

export const getWorkerSimpleCategories = async () => {
  try {
    console.log("Fetching worker simple categories...");
    const categories = await prisma.workerSimpleCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });
    console.log("Found worker simple categories:", categories);
    return { ok: true, data: categories };
  } catch (error) {
    console.error("Error fetching worker simple categories:", error);
    return { ok: false, error: error.message };
  }
};
