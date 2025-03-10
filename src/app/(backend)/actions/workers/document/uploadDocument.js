"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";

// Support both field names for backward compatibility using Zod
const payloadSchema = z.object({
  workerId: z.string().optional(),
  foreignWorkerId: z.string().optional(),
  documentAssetId: z.string(),
  documentType: z.enum(["UPLOADED", "SIGNED", "REMOTE_DOCUMENT"]),
  name: z.string(),
  simpleCategoryId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
}).refine(
  data => !!data.workerId || !!data.foreignWorkerId,
  { message: "Either workerId or foreignWorkerId must be provided" }
);

/**
 * Uploads a document for a worker
 * @param {Object} data - The document data
 * @param {string} [data.workerId] - The ID of the worker (use this or foreignWorkerId)
 * @param {string} [data.foreignWorkerId] - The ID of the worker (use this or workerId)
 * @param {string} data.documentAssetId - The ID of the document asset
 * @param {string} data.documentType - The type of document (UPLOADED, SIGNED, REMOTE_DOCUMENT)
 * @param {string} data.name - The name of the document
 * @param {string} [data.simpleCategoryId] - The ID of the document category (optional)
 * @param {string} [data.note] - Additional notes for the document (optional)
 * @param {string} [data.userId] - The ID of the user uploading the document (optional)
 * @returns {Promise<{ok: boolean, data?: Object, message?: string}>} Result with document data
 */
export async function uploadDocument(data) {
  try {
    // Validate input data with Zod
    const validatedData = payloadSchema.parse(data);
    
    // Support both workerId and foreignWorkerId (backward compatibility)
    const workerId = validatedData.workerId || validatedData.foreignWorkerId;
    const assetId = validatedData.documentAssetId;
    
    // Check if worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true }
    });

    if (!worker) {
      return { ok: false, message: "Worker not found" };
    }

    // Check if document asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true }
    });

    if (!asset) {
      return { ok: false, message: "Asset not found" };
    }

    // Create the worker document
    const workerDocument = await prisma.workerDocument.create({
      data: {
        worker: { connect: { id: workerId } },
        asset: { connect: { id: assetId } },
        type: validatedData.documentType,
        name: validatedData.name,
        status: "UPLOADED",
        note: validatedData.note || null,
        ...(validatedData.simpleCategoryId && {
          simpleCategory: { connect: { id: validatedData.simpleCategoryId } }
        }),
        ...(validatedData.userId && {
          uploadedByUser: { connect: { id: validatedData.userId } }
        })
      }
    });

    // Revalidate cache for worker documents
    revalidateTag("worker-documents");

    return {
      ok: true,
      data: workerDocument,
      message: "Document uploaded successfully"
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 