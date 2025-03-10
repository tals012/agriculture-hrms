"use server";

import Joi from "joi";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const payloadSchema = Joi.object({
  slug: Joi.string().required(),
  password: Joi.string().required(),
});

export const validatePasswordForRemoteDocSignIn = async (data) => {
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

    if (!doc.isRemoteDocPasswordProtected) {
      return {
        ok: true,
      };
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      doc.remoteDocPassword
    );
    if (!isPasswordValid) {
      return {
        ok: false,
        message: "Incorrect password!",
      };
    }

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
