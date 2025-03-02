"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
export const deleteWorkerSimpleCategory = async (formData) => {
  try {
    const id = formData.get("id");

    if (!id) {
      return { ok: false, error: "Missing required fields" };
    }

    await prisma.workerSimpleCategory.delete({
      where: { id },
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error deleting worker simple category:", error);
    return { ok: false, error: error.message };
  }
};
