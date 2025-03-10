"use server";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import Joi from "joi";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { sendSms } from "../../sms/sendSms";
import bcrypt from "bcrypt";

const payloadSchema = Joi.object({
  foreignWorkerId: Joi.string().required(),
  templateId: Joi.string().required(),
  name: Joi.string().required(),
  simpleCategoryId: Joi.string().optional().allow("", null),
  note: Joi.string().optional().allow("", null),
  userId: Joi.string().optional().allow("", null),
});

const getUniqueSlug = async () => {
  let slug = nanoid(8);
  const doc = await prisma.workerDocument.findFirst({
    where: {
      slug,
    },
  });
  if (doc) {
    return await getUniqueSlug();
  }
  return slug;
};

const sendLinkToWorker = async ({ workerDocumentId, phone, slug }) => {
  const _password = String(Math.floor(1000 + Math.random() * 9000));

  const isSuccess = await sendSms({
    phone,
    message: `Please fill and sign the document at the following link: ${process.env.NEXT_PUBLIC_API_URL}/${slug} \nThe password for the document is ${_password}`,
  });
  const password = await bcrypt.hash(_password, 10);
  console.log("PASSWORD FOR DOC is ", _password);

  await prisma.workerDocument.update({
    where: {
      id: workerDocumentId,
    },
    data: {
      remoteDocSmsStatus: isSuccess ? "COMPLETED" : "FAILED",
      remoteDocSmsStatusAt: new Date(),
      ...(isSuccess && {
        isRemoteDocPasswordProtected: true,
        remoteDocPassword: password,
      }),
    },
  });
};

export const sendForRemoteSignature = async (data) => {
  try {
    await payloadSchema.validateAsync(data);
    const {
      templateId,
      foreignWorkerId,
      name,
      simpleCategoryId,
      note,
      userId,
    } = data;

    const template = await prisma.foreignWorkerDigitalFormTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        templateAsset: true,
      },
    });
    if (!template) {
      return { ok: false, message: "Template not found!" };
    }

    const newAsset = await prisma.asset.create({
      data: {
        ...template.templateAsset,
        id: createId(),
      },
    });

    const foreignWorker = await prisma.foreignWorker.findUnique({
      where: {
        id: foreignWorkerId,
      },
      select: {
        id: true,
        israelPhoneNumber: true,
      },
    });

    if (!foreignWorker) {
      return { ok: false, message: "Foreign worker not found!" };
    }

    if (!foreignWorker.israelPhoneNumber) {
      return {
        ok: false,
        message: "Foreign worker does not have a phone number",
      };
    }
    // Generate a unique slug for the document
    const slug = await getUniqueSlug();

    const workerDoc = await prisma.$transaction(async (trx) => {
      const d = await trx.workerDocument.create({
        data: {
          documentAssetId: newAsset.id,
          type: "REMOTE_DOCUMENT",
          foreignWorkerId,
          name,
          simpleCategoryId,
          note,
          slug,
          uploadedByUserId: userId,
          remoteDocInitiatedAt: new Date(),
          remoteDocSmsStatus: "INITIALIZED",
          remoteDocSmsStatusAt: new Date(),
          authMode: "PHONE_OTP",
        },
      });
      await trx.asset.update({
        where: {
          id: newAsset.id,
        },
        data: {
          status: "READY",
        },
      });
      return d;
    });
    sendLinkToWorker({
      phone: foreignWorker.israelPhoneNumber,
      workerDocumentId: workerDoc.id,
      slug: workerDoc.slug,
    });

    revalidateTag("asd");
    return { ok: true, message: "Document sent successfully!" };
  } catch (e) {
    console.log(e);
    return { ok: false, message: "Failed to send the document!" };
  }
};
