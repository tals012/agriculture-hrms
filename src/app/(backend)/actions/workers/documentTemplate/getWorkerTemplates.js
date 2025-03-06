"use server";

import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";

const getSingleTemplate = async (templateFromDB) => {
  const { id, name, description, createdAt, templateAsset, templateCategory } = templateFromDB;
  
  try {
    const link = await getSignedUrl(templateAsset.filePath);
    return {
      id,
      name,
      description,
      createdAt,
      link,
      templateCategoryId: templateCategory?.id || null,
      templateCategoryName: templateCategory?.name || null,
    };
  } catch (e) {
    console.error("Error in getSingleTemplate:", e);
    return {
      id,
      name,
      description,
      createdAt,
      link: "",
      templateCategoryId: templateCategory?.id || null,
      templateCategoryName: templateCategory?.name || null,
    };
  }
};

export const getWorkerTemplates = async () => {
  try {
    const templates = await prisma.workerDigitalFormTemplate.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        templateAsset: true,
        templateCategory: true,
      },
    });

    const dataPromise = templates.map(getSingleTemplate);
    const data = await Promise.all(dataPromise);

    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { ok: false, error: error.message };
  }
};
