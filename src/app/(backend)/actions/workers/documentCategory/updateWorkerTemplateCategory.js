"use server";

import prisma from "@/lib/prisma";

export const updateWorkerTemplateCategory = async (formData) => {
  try {
    const id = formData.get("id");
    const name = formData.get("name");

    if (!id || !name) {
      return { ok: false, error: "Missing required fields" };
    }

    const updatedCategory = await prisma.workerTemplateCategory.update({
      where: { id },
      data: { name },
    });

    return { ok: true, data: updatedCategory };
  } catch (error) {
    console.error("Error updating worker template category:", error);
    return { ok: false, error: error.message };
  }
};
