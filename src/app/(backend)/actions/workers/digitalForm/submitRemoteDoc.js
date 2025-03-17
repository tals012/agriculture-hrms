"use server";

import prisma from "@/lib/prisma";
import Joi from "joi";

const payloadSchema = Joi.object({
  slug: Joi.string().required(),
  assetId: Joi.string().required(),
});

export const submitRemoteDoc = async (data) => {
  try {
    await payloadSchema.validateAsync(data);
    const doc = await prisma.workerDocument.findFirst({
      where: {
        OR: [{ slug: data.slug }, { id: data.slug }],
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
        message: "This document has already been submitted!",
      };
    }
    await prisma.workerDocument.update({
      where: {
        id: doc.id,
      },
      data: {
        isRemoteDocSubmitted: true,
        remoteDocSubmittedAt: new Date(),
        documentAssetId: data.assetId,
      },
    });
    return {
      ok: true,
      message: "Document submitted successfully!",
    };
  } catch (e) {
    return {
      ok: false,
      message: e.message || "Something went wrong! Please try again.",
    };
  }
};
