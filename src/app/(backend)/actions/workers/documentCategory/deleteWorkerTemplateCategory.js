"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteWorkerTemplateCategory(formData) {
  const id = formData.get("id");

  try {
    await prisma.workerTemplateCategory.delete({
      where: {
        id,
      },
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error deleting worker category:", error);
    return { ok: false, error: "Failed to delete category" };
  }
}
