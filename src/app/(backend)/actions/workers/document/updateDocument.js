"use server";

import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const payloadSchema = z.object({
  id: z.string(),
  categoryId: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  note: z.string().nullable().optional()
});

/**
 * Updates a worker document
 * 
 * @param {Object} data - Update data
 * @param {string} data.id - Document ID
 * @param {string} [data.categoryId] - New category ID (optional)
 * @param {string} [data.name] - New document name (optional)
 * @param {string} [data.note] - New document note (optional)
 * @returns {Promise<{ok: boolean, data?: Object, message?: string}>} Result with updated document
 */
export async function updateDocument(data) {
  try {
    // Validate with Zod
    const validatedData = payloadSchema.parse(data);
    
    // Check if document exists
    const document = await prisma.workerDocument.findUnique({
      where: { id: validatedData.id },
      select: { id: true, workerId: true }
    });

    if (!document) {
      return { ok: false, message: "Document not found" };
    }

    // Prepare update data object
    const updateData = {};
    
    // Handle category relation if provided
    if (validatedData.categoryId !== undefined) {
      if (validatedData.categoryId) {
        // Connect to a new category
        updateData.simpleCategory = {
          connect: { id: validatedData.categoryId }
        };
      } else {
        // Disconnect from current category
        updateData.simpleCategory = {
          disconnect: true
        };
      }
    }
    
    // Update basic fields
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name || document.name;
    }
    
    if (validatedData.note !== undefined) {
      updateData.note = validatedData.note || null;
    }
    
    // Update the document
    const updatedDocument = await prisma.workerDocument.update({
      where: { id: validatedData.id },
      data: updateData
    });

    // Revalidate cache for worker documents
    revalidateTag("worker-documents");

    return {
      ok: true,
      data: updatedDocument,
      message: "Document updated successfully"
    };
  } catch (error) {
    console.error("Error updating document:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 