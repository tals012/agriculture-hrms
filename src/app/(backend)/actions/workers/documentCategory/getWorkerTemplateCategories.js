"use server";

import prisma from "@/lib/prisma";

export const getWorkerTemplateCategories = async () => {
  try {
    const categories = await prisma.workerTemplateCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return { ok: true, data: categories };
  } catch (error) {
    console.error("Error fetching worker template categories:", error);
    return { ok: false, error: error.message };
  }
};
