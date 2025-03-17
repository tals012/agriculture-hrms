"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function editWorkerCategory(formData) {
  const id = formData.get("id");
  const name = formData.get("name");

  try {
    await prisma.documentCategoryWorker.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    revalidatePath("/admin/settings/categories/worker");
    redirect("/admin/settings/categories/worker");
  } catch (error) {
    console.error("Error editing worker category:", error);
    return { ok: false, error: "Failed to edit category" };
  }
}
