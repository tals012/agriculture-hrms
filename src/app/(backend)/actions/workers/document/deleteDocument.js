"use server";

import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const deleteDocumentSchema = z.object({
  documentId: z.string({
    required_error: "Document ID is required"
  })
});

/**
 * Deletes a worker document
 * 
 * @param {Object} params - Query parameters
 * @param {string} params.documentId - The ID of the document to delete
 * @returns {Promise<{ok: boolean, message: string}>} Result of the operation
 */
export async function deleteDocument(params) {
  try {
    // Validate with Zod
    const { documentId } = deleteDocumentSchema.parse(params);
    
    // Check if document exists and get associated worker ID
    const document = await prisma.workerDocument.findUnique({
      where: { id: documentId },
      select: { 
        id: true, 
        workerId: true,
        assetId: true
      }
    });

    if (!document) {
      return { ok: false, message: "Document not found" };
    }

    try {
      // Delete the document record
      await prisma.workerDocument.delete({
        where: { id: documentId }
      });

      // If there's an associated asset, we can optionally delete it as well
      if (document.assetId) {
        // This is optional - you may want to keep assets
        await prisma.asset.delete({
          where: { id: document.assetId }
        });
      }

      // Revalidate cache for worker documents
      revalidateTag("worker-documents");

      return { ok: true, message: "Document deleted successfully" };
    } catch (error) {
      console.error("Error during document deletion:", error);
      
      // If the delete operation fails due to constraints, try updating it as deleted instead
      if (error.code === 'P2003' || error.code === 'P2001') {
        // Handle constraint errors by soft-deleting
        const updated = await prisma.workerDocument.update({
          where: { id: documentId },
          data: {
            // If you have a field like isDeleted in your schema, use it
            // isDeleted: true,
            // Otherwise, you can add a status to indicate deletion
            status: "DELETED"
          }
        });
        
        if (updated) {
          return { ok: true, message: "Document marked as deleted" };
        }
      }
      
      throw error; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 