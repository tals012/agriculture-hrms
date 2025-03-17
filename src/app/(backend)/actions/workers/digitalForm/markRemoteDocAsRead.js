"use server";

import prisma from "@/lib/prisma";
import Joi from "joi";

const payloadSchema = Joi.object({
  slug: Joi.string().required(),
});

export const markRemoteDocAsRead = async (data) => {
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
    await prisma.workerDocument.update({
      where: {
        id: doc.id,
      },
      data: {
        isRemoteDocRead: true,
        remoteDocReadAt: new Date(),
      },
    });
    return {
      ok: true,
    };
  } catch (e) {
    return {
      ok: false,
      message: e.message || "Something went wrong! Please try again.",
    };
  }
};
