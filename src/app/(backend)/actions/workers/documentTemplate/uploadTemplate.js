"use server";

import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";

export const uploadTemplate = async (formData) => {
  try {
    // Extract data from the formData
    const name = formData.get("name");
    const description = formData.get("description");
    const categoryId = formData.get("categoryId") || null;
    const file = formData.get("file");

    if (!name || !file) {
      return { ok: false, error: "Missing required fields" };
    }

    // Check file type
    if (file.type !== "application/pdf") {
      return { ok: false, error: "Only PDF files are allowed" };
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop();
    
    // Create signed upload URLs
    const signedUrlsResponse = await createSignedUploadURLs({
      files: [{ ext: `.${fileExtension}`, type: "PDF" }],
    });

    if (!signedUrlsResponse.ok) {
      return { ok: false, error: signedUrlsResponse.error || "Failed to create signed upload URLs" };
    }

    const { assetId, assetStorageFileUploadURL } = signedUrlsResponse.data[0];

    // Create a DigitalFormTemplate record
    const template = await prisma.workerDigitalFormTemplate.create({
      data: {
        name,
        description,
        templateCategoryId: categoryId || null,
        templateAssetId: assetId,
      },
    });

    return {
      ok: true,
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        categoryId: template.templateCategoryId,
        assetId: template.templateAssetId,
        uploadUrl: assetStorageFileUploadURL,
      },
    };
  } catch (error) {
    console.error("Error creating template:", error);
    return { ok: false, error: error.message || "An error occurred" };
  }
};
