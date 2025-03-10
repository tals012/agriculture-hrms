"use server";

import Joi from "joi";
import { getSignedUrl } from "@/lib/s3";
import prisma from "@/lib/prisma";

const payloadSchema = Joi.object({
  slug: Joi.string().required(),
});

export const getFormForRemoteDocSignIn = async (data) => {
  try {
    await payloadSchema.validateAsync(data);

    // Try to find document by slug first
    let doc = await prisma.workerDocument.findFirst({
      where: {
        OR: [
          { slug: data.slug },
          { id: data.slug }, // Also try to find by ID
        ],
      },
      include: {
        documentAsset: true,
        foreignWorker: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!doc) {
      return {
        ok: false,
        message: "This document doesn't exist!",
      };
    }

    if (doc.isRemoteDocSubmitted) {
      return {
        ok: false,
        alreadySubmitted: true,
        message: "This document has already been submitted",
      };
    }

    const { id, documentAsset, foreignWorker } = doc;
    const link = await getSignedUrl(documentAsset.filePath);

    return {
      ok: true,
      data: {
        id,
        link,
        foreignWorkerId: doc.foreignWorkerId,
        isRemoteDocPasswordProtected: !!doc.isRemoteDocPasswordProtected,
        countryCode: foreignWorker.country?.code || "other",
      },
    };
  } catch (e) {
    return {
      ok: false,
      message: e.message || "Something went wrong! Please try again.",
    };
  }
};
