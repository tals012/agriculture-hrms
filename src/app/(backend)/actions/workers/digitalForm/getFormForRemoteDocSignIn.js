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

    let doc = await prisma.workerDocument.findFirst({
      where: {
        OR: [{ slug: data.slug }, { id: data.slug }],
      },
      include: {
        documentAsset: true,
        worker: {
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
        documentAsset: doc.documentAsset,
        message: "This document has already been submitted",
      };
    }

    const { id, documentAsset, worker } = doc;
    const link = await getSignedUrl(documentAsset.filePath);

    return {
      ok: true,
      data: {
        id,
        link,
        workerId: worker.id,
        isRemoteDocPasswordProtected: !!doc.isRemoteDocPasswordProtected,
        countryCode: worker.country?.code || "other",
      },
    };
  } catch (e) {
    return {
      ok: false,
      message: e.message || "Something went wrong! Please try again.",
    };
  }
};
