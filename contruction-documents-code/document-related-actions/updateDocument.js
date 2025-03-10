"use server";

import prisma from "@/lib/prisma";

export const updateWorkerDocument = async ({ id, categoryId }) => {
  try {
    console.log("Updating document:", { id, categoryId });
    const document = await prisma.workerDocument.update({
      where: {
        id,
      },
      data: {
        simpleCategoryId: categoryId,
      },
      include: {
        simpleCategory: true,
      },
    });

    console.log("Updated document:", document);
    return { ok: true, data: document };
  } catch (error) {
    console.error("Error updating document:", error);
    return { ok: false, error: error.message };
  }
};
