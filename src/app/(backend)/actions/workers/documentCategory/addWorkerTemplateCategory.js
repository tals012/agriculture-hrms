"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addWorkerTemplateCategory(formData) {
  const name = formData.get("name");

  try {
    await prisma.workerTemplateCategory.create({
      data: {
        name,
      },
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error adding worker category:", error);
    return { ok: false, error: "Failed to add category" };
  }
}
