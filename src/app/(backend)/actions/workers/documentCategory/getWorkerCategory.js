"use server";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getWorkerCategory = async (id) => {
  try {
    const category = await prisma.documentCategoryWorker.findUnique({
      where: {
        id,
      },
    });
    return { ok: true, data: category };
  } catch (error) {
    console.error("Error fetching worker category:", error);
    return { ok: false, error: error.message };
  }
};
