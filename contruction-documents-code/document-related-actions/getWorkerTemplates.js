"use server";
import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";
const link = await getSignedUrl(documentAsset.filePath);

const getSingleTemplate = async (templateFromDB) => {
  const { id, name, createdAt, templateAsset, documentCategory } =
    templateFromDB;
  try {
    const link = await getSignedUrl(templateAsset.filePath);
    return {
      id,
      name,
      createdAt,
      link,
      documentCategoryId: documentCategory?.id || null,
      documentCategoryName: documentCategory?.name || null,
    };
  } catch (e) {
    console.error("Error in getSingleTemplate:", e);
    return {
      id,
      name,
      createdAt,
      link: "",
      documentCategoryId: documentCategory?.id || null,
      documentCategoryName: documentCategory?.name || null,
    };
  }
};

export const getWorkerTemplates = async () => {
  try {
    console.log("Fetching templates...");
    const templates = await prisma.foreignWorkerDigitalFormTemplate.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        templateAsset: true,
        documentCategory: true,
      },
    });
    console.log("Templates fetched:", templates);

    const dataPromise = templates.map(getSingleTemplate);
    const data = await Promise.all(dataPromise);
    console.log("Processed templates:", data);

    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { ok: false, error: error.message };
  }
};
