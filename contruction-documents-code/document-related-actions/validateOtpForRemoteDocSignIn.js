"use server";

import prisma from "@/lib/prisma";
import Joi from "joi";

const payloadSchema = Joi.object({
  slug: Joi.string().required(),
  code: Joi.string().required(),
});

export const validateOtpForRemoteDocSignIn = async (data) => {
  try {
    await payloadSchema.validateAsync(data);
    const doc = await prisma.workerDocument.findFirst({
      where: {
        slug: data.slug,
      },
    });
    if (!doc) {
      return {
        ok: false,
        message: "This document doesn't exist!",
      };
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        otp: data.code,
        foreignWorkerId: doc.foreignWorkerId,
        purpose: "REMOTE_DOCUMENT_VIEW",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!otp) {
      return {
        ok: false,
        message: "Invalid OTP!",
      };
    }
    await prisma.oTP.delete({
      where: {
        id: otp.id,
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
