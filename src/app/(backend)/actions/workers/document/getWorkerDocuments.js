"use server";

import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// Support both field names for backward compatibility using Zod
const payloadSchema = z.object({
  workerId: z.string().optional(),
  foreignWorkerId: z.string().optional(),
}).refine(
  data => !!data.workerId || !!data.foreignWorkerId, 
  { message: "Either workerId or foreignWorkerId must be provided" }
);

/**
 * Get documents for a specific worker
 * 
 * @param {Object} data - Query parameters
 * @param {string} [data.workerId] - The ID of the worker (use this or foreignWorkerId)
 * @param {string} [data.foreignWorkerId] - The ID of the worker (use this or workerId)
 * @returns {Promise<{ok: boolean, data?: Array, message?: string}>} Result with worker documents
 */
export async function getWorkerDocuments(data) {
  try {
    // Validate with Zod
    const validatedData = payloadSchema.parse(data);
    
    // Support both field names (workerId and foreignWorkerId)
    const workerId = validatedData.workerId || validatedData.foreignWorkerId;
    
    console.log("Fetching documents for worker:", workerId);
    
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true }
    });

    if (!worker) {
      return { ok: false, message: "Worker not found" };
    }

    const documents = await prisma.workerDocument.findMany({
      where: {
        workerId
      },
      include: {
        documentAsset: true,
        simpleCategory: true,
        uploadedByUser: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate signed URLs for document assets
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        let url = null;
        
        if (doc.documentAsset && doc.documentAsset.filePath) {
          try {
            url = await getSignedUrl(doc.documentAsset.filePath);
          } catch (error) {
            console.error(`Error generating signed URL for document ${doc.id}:`, error);
          }
        }
        
        return {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          status: doc.status || "UPLOADED", // Provide default status if not present
          note: doc.note,
          createdAt: doc.createdAt,
          url,
          simpleCategoryId: doc.simpleCategoryId,
          categoryName: doc.simpleCategory?.name || null,
          uploadedByName: doc.uploadedByUser?.name || null
        };
      })
    );

    return { 
      ok: true, 
      data: documentsWithUrls 
    };
  } catch (error) {
    console.error("Error fetching worker documents:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 