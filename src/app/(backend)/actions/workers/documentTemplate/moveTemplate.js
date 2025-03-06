"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const moveTemplate = async (templateId, newCategoryId) => {
  try {
    await prisma.workerDigitalFormTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        templateCategoryId: newCategoryId || null,
      },
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error moving template:", error);
    return { ok: false, error: "Failed to move template" };
  }
};
