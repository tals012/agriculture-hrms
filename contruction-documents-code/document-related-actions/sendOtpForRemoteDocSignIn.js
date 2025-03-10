"use server";

import Joi from "joi";
import { sendSms } from "../../sms/sendSms";
import prisma from "@/lib/prisma";

const payloadSchema = Joi.object({
  slug: Joi.string().required(),
  phone: Joi.string().required(),
});

export const sendOtpForRemoteDocSignIn = async (data) => {
  try {
    console.log("sendOtpForRemoteDocSignIn", data);
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
    const fWorker = await prisma.foreignWorker.findUnique({
      where: {
        id: doc.foreignWorkerId,
      },
      select: {
        israelPhoneNumber: true,
      },
    });

    if (!fWorker) {
      return {
        ok: false,
        message: "Foreign worker not found!",
      };
    }

    if (fWorker.israelPhoneNumber !== data.phone) {
      return {
        ok: false,
        message: "You do not the permission to view this document.",
      };
    }

    // 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    await prisma.oTP.create({
      data: {
        otp: String(otp),
        purpose: "REMOTE_DOCUMENT_VIEW",
        foreignWorkerId: doc.foreignWorkerId,
      },
    });
    sendSms({
      phone: data.phone,
      message: `Your OTP for viewing the document is ${otp}`,
    });
    return {
      ok: true,
      message: "OTP was sent to your phone number!",
    };
  } catch (e) {
    return {
      ok: false,
      message: e.message || "Something went wrong! Please try again.",
    };
  }
};
