"use server";

import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { createSignedUploadUrl } from "@/lib/s3";

const createSignedUploadURLsForAssetAndThumbnail = async ({
  assetStorageFilePath,
  thumbnailStorageFilePath,
  assetId,
  meta,
}) => {
  const assetUploadURL = await createSignedUploadUrl(assetStorageFilePath);
  const thumbnailUploadURL = thumbnailStorageFilePath
    ? await createSignedUploadUrl(thumbnailStorageFilePath)
    : null;
  return {
    assetStorageFileUploadURL: assetUploadURL,
    thumbnailStorageFileUploadURL: thumbnailUploadURL,
    assetStorageFilePath,
    thumbnailStorageFilePath,
    assetId,
    ...meta,
  };
};

const getFilePath = ({
  type,
  assetId,
  ext,
  fileName = "original",
}) => {
  const baseDir = `documents`;
  const typeDir = type.toLowerCase();

  return `${baseDir}/${typeDir}/${assetId}/${fileName}${ext}`;
};

export const createSignedUploadURLs = async ({ files }) => {
  try {
    const uploadURLPromises = files.map((i) => {
      const assetId = uuidv4();

      const assetStorageFilePath = getFilePath({
        type: i.type,
        assetId,
        ext: i.ext,
        fileName: "original",
      });
      
      const thumbnailStorageFilePath = i.thumbnailExt
        ? getFilePath({
            type: i.type,
            assetId,
            ext: i.thumbnailExt,
            fileName: "thumbnail",
          })
        : null;

      return createSignedUploadURLsForAssetAndThumbnail({
        assetStorageFilePath,
        thumbnailStorageFilePath,
        assetId,
        meta: i,
      });
    });

    const uploadURLs = await Promise.all(uploadURLPromises);

    const assetsToCreate = uploadURLs.map((i) => ({
      id: i.assetId,
      filePath: i.assetStorageFilePath,
      thumbnailFilePath: i.thumbnailStorageFilePath,
      type: i.type,
      status: "NOT_READY",
    }));

    await prisma.asset.createMany({
      data: assetsToCreate,
    });

    const dataToSend = uploadURLs.map((i) => ({
      assetStorageFileUploadURL: i.assetStorageFileUploadURL,
      thumbnailStorageFileUploadURL: i.thumbnailStorageFileUploadURL,
      assetId: i.assetId,
    }));

    return { ok: true, data: dataToSend };
  } catch (error) {
    console.error("Error creating signed upload URLs:", error);
    return { ok: false, error: error.message || "Failed to create signed upload URLs" };
  }
}; 