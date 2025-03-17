"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const createWorkerFormTemplate = async ({
  templateAssetId,
  name,
  templateCategoryId,
}) => {
  try {
    await prisma.$transaction(async (trx) => {
      const template = await trx.workerDigitalFormTemplate.create({
        data: {
          name,
          templateAssetId,
          templateCategoryId,
        },
      });

      await trx.asset.update({
        where: {
          id: templateAssetId,
        },
        data: {
          status: "READY",
        },
      });
      return template;
    });
    
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error creating template:", error);
    return { ok: false, error: error.message };
  }
}; 