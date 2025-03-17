"use server";
import prisma from "@/lib/prisma";
import Joi from "joi";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";

const payloadSchema = Joi.object({
  foreignWorkerId: Joi.string().required(),
  documentAssetId: Joi.string().required(),
  documentType: Joi.string().valid("UPLOADED", "SIGNED").required(),
  name: Joi.string().required(),
  simpleCategoryId: Joi.string().optional().allow("", null),
  note: Joi.string().optional().allow("", null),
  userId: Joi.string().optional().allow("", null),
});

export const uploadDocument = async (data) => {
  try {
    console.log("Uploading document with data:", data);
    await payloadSchema.validateAsync(data);
    const {
      documentAssetId,
      documentType,
      foreignWorkerId,
      name,
      simpleCategoryId,
      note,
      userId,
    } = data;
    const foreignWorker = await prisma.worker.findUnique({
      where: {
        id: foreignWorkerId,
      },
      select: {
        id: true,
      },
    });

    if (!foreignWorker) {
      return { ok: false, message: "Foreign worker not found!" };
    }
    // Generate a unique slug for the document
    const slug = nanoid(8);
    const doc = await prisma.workerDocument.create({
      data: {
        documentAssetId,
        type: documentType,
        workerId: foreignWorkerId,
        name,
        simpleCategoryId,
        note,
        slug, // Save the slug here
        uploadedByUserId: userId,
      },
      include: {
        simpleCategory: true,
      },
    });

    console.log("Created document:", doc);
    revalidateTag("asd");
    return { ok: true, message: "Document saved successfully!" };
  } catch (e) {
    console.error("Error uploading document:", e);
    return { ok: false, message: "Failed to save the document!" };
  }
};
