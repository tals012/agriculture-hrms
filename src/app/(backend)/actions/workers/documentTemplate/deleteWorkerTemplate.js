"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const deleteWorkerTemplate = async (formData) => {
  const templateId = formData.get("templateId");
  
  if (!templateId) {
    return { ok: false, error: "Template ID is required" };
  }
  
  const template = await prisma.workerDigitalFormTemplate.findUnique({
    where: {
      id: templateId,
    },
  });

  if (!template) {
    return { ok: false, error: "Template not found" };
  }

  try {
    await prisma.workerDigitalFormTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        isDeleted: true,
      },
    });
    
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { ok: false, error: "Failed to delete template" };
  }
};
