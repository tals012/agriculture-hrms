"use server";

import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import Joi from "joi";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { sendSms } from "../../sms/sendSms";
import bcrypt from "bcrypt";

const payloadSchema = Joi.object({
  workerIds: Joi.array().items(Joi.string()).required(),
  templateIds: Joi.array().items(Joi.string()).required(),
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
  const password = await bcrypt.hash(_password, 10);

  const isSuccess = await sendSms({
    phone,
    message: `Please fill and sign the document at the following link: ${process.env.NEXT_PUBLIC_API_URL}/${slug} \nThe password for the document is ${_password}`,
  });

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

  return isSuccess;
};

export const sendBulkRemoteSignature = async (data) => {
  try {
    await payloadSchema.validateAsync(data);
    const { workerIds, templateIds, userId } = data;

    // Get all workers with their phone numbers
    const workers = await prisma.foreignWorker.findMany({
      where: {
        id: {
          in: workerIds,
        },
      },
      select: {
        id: true,
        israelPhoneNumber: true,
      },
    });

    // Get all templates
    const templates = await prisma.foreignWorkerDigitalFormTemplate.findMany({
      where: {
        id: {
          in: templateIds,
        },
      },
      include: {
        templateAsset: true,
      },
    });

    const results = [];

    // For each worker and template combination
    for (const worker of workers) {
      if (!worker.israelPhoneNumber) {
        results.push({
          workerId: worker.id,
          success: false,
          message: "Worker has no phone number",
        });
        continue;
      }

      for (const template of templates) {
        try {
          // Create new asset from template
          const newAsset = await prisma.asset.create({
            data: {
              ...template.templateAsset,
              id: createId(),
            },
          });

          // Generate unique slug
          const slug = await getUniqueSlug();

          // Create worker document
          const workerDoc = await prisma.$transaction(async (trx) => {
            const d = await trx.workerDocument.create({
              data: {
                documentAssetId: newAsset.id,
                type: "REMOTE_DOCUMENT",
                foreignWorkerId: worker.id,
                name: template.name,
                simpleCategoryId: template.simpleCategoryId,
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

          // Send SMS to worker
          const smsSuccess = await sendLinkToWorker({
            workerDocumentId: workerDoc.id,
            phone: worker.israelPhoneNumber,
            slug: workerDoc.slug,
          });

          results.push({
            workerId: worker.id,
            templateId: template.id,
            success: true,
            smsStatus: smsSuccess ? "SENT" : "FAILED",
          });
        } catch (error) {
          console.error(
            `Error processing worker ${worker.id} with template ${template.id}:`,
            error
          );
          results.push({
            workerId: worker.id,
            templateId: template.id,
            success: false,
            message: error.message,
          });
        }
      }
    }

    revalidateTag("asd");
    return { ok: true, message: "Documents processed", results };
  } catch (e) {
    console.error("Error in bulk send:", e);
    return { ok: false, message: "Failed to process documents" };
  }
};
