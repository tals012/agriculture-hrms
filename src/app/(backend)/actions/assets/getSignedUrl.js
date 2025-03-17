"use server";

import { getSignedUrl } from "@/lib/s3";

export const getSignedFileUrl = async (filePath) => {
  try {
    if (!filePath) {
      return { ok: false, error: "File path is required" };
    }

    const signedUrl = await getSignedUrl(filePath);
    return { ok: true, data: signedUrl };
  } catch (error) {
    console.error("Error getting signed URL:", error);
    return { ok: false, error: "Failed to get signed URL" };
  }
}; 