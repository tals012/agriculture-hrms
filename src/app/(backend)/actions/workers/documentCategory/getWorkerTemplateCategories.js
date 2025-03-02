"use server";

import prisma from "@/lib/prisma";

export const getWorkerTemplateCategories = async () => {
  try {
    console.log("Fetching worker template categories...");
    const categories = await prisma.workerTemplateCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });
    console.log("Categories fetched:", categories);
    return { ok: true, data: categories };
  } catch (error) {
    console.error("Error fetching worker template categories:", error);
    return { ok: false, error: error.message };
  }
};
