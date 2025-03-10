"use server";

import prisma from "@/lib/prisma";

export const deleteWorkerDocument = async (workerDocumentId) => {
  try {
    console.log("Deleting document:", workerDocumentId);
    const workerDocument = await prisma.workerDocument.findUnique({
      where: {
        id: workerDocumentId,
      },
      select: {
        id: true,
        documentAssetId: true,
        type: true,
        isRemoteDocSubmitted: true,
      },
    });

    if (!workerDocument) {
      return { ok: false, message: "Document not found!" };
    }

    // For remote documents that have been submitted, we need to handle the asset deletion
    if (workerDocument.type === "REMOTE_DOCUMENT") {
      if (
        workerDocument.isRemoteDocSubmitted &&
        workerDocument.documentAssetId
      ) {
        await prisma.$transaction(async (trx) => {
          await trx.workerDocument.delete({
            where: {
              id: workerDocumentId,
            },
          });
          await trx.asset.delete({
            where: {
              id: workerDocument.documentAssetId,
            },
          });
        });
      } else {
        // For remote documents that haven't been submitted yet, just delete the document
        await prisma.workerDocument.delete({
          where: {
            id: workerDocumentId,
          },
        });
      }
    } else {
      // For normal documents, delete both document and asset
      await prisma.$transaction(async (trx) => {
        await trx.workerDocument.delete({
          where: {
            id: workerDocumentId,
          },
        });
        if (workerDocument.documentAssetId) {
          await trx.asset.delete({
            where: {
              id: workerDocument.documentAssetId,
            },
          });
        }
      });
    }

    return { ok: true };
  } catch (e) {
    console.error("Error deleting document:", e);
    return { ok: false, message: "Something went wrong!" };
  }
};
