"use server";

import prisma from "@/lib/prisma";

export const addWorkerSimpleCategory = async (formData) => {
  try {
    const name = formData.get("name");

    if (!name) {
      return { ok: false, error: "Missing required fields" };
    }

    const newCategory = await prisma.workerSimpleCategory.create({
      data: { name },
    });

    return { ok: true, data: newCategory };
  } catch (error) {
    console.error("Error creating worker simple category:", error);
    return { ok: false, error: error.message };
  }
};
