"use server";

import { uploadDocument } from './uploadDocument';
import { z } from 'zod';

// Schema validation for multiple document uploads using Zod
const multipleDocumentsSchema = z.object({
  workerId: z.string().optional(),
  foreignWorkerId: z.string().optional(),
  documentAssetIds: z.array(z.string()),
  documentType: z.enum(["UPLOADED", "SIGNED", "REMOTE_DOCUMENT"]),
  names: z.array(z.string()),
  simpleCategoryId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
}).refine(
  data => !!data.workerId || !!data.foreignWorkerId,
  { message: "Either workerId or foreignWorkerId must be provided" }
).refine(
  data => data.documentAssetIds.length === data.names.length,
  { message: "The number of documentAssetIds must match the number of names" }
);

/**
 * Uploads multiple documents for a worker
 * 
 * @param {Object} data - The upload data
 * @param {string} [data.workerId] - The ID of the worker (use this or foreignWorkerId)
 * @param {string} [data.foreignWorkerId] - The ID of the worker (use this or workerId)
 * @param {string[]} data.documentAssetIds - Array of document asset IDs
 * @param {string} data.documentType - Type of documents (UPLOADED, SIGNED, REMOTE_DOCUMENT)
 * @param {string[]} data.names - Array of document names
 * @param {string} [data.simpleCategoryId] - Category ID (optional)
 * @param {string} [data.note] - Note for the documents (optional)
 * @param {string} [data.userId] - ID of the user uploading (optional)
 * @returns {Promise<{ok: boolean, message: string, results?: Array}>} Result of the operation
 */
export async function uploadMultipleDocuments(data) {
  try {
    // Validate with Zod
    const validatedData = multipleDocumentsSchema.parse(data);
    
    const { 
      workerId, 
      foreignWorkerId, 
      documentAssetIds, 
      documentType, 
      names, 
      simpleCategoryId, 
      note, 
      userId 
    } = validatedData;

    if (documentAssetIds.length === 0) {
      return { ok: false, message: "No document assets provided" };
    }

    const results = [];
    const errors = [];

    // Process each document
    for (let i = 0; i < documentAssetIds.length; i++) {
      try {
        const result = await uploadDocument({
          workerId,
          foreignWorkerId,
          documentAssetId: documentAssetIds[i],
          documentType,
          name: names[i],
          simpleCategoryId,
          note,
          userId
        });

        results.push({
          index: i,
          success: result.ok,
          message: result.message,
          data: result.data
        });

        if (!result.ok) {
          errors.push(`Document ${i + 1}: ${result.message}`);
        }
      } catch (error) {
        console.error(`Error uploading document at index ${i}:`, error);
        results.push({
          index: i,
          success: false,
          message: error.message
        });
        errors.push(`Document ${i + 1}: ${error.message}`);
      }
    }

    // Return aggregated results
    if (errors.length === 0) {
      return {
        ok: true,
        message: `Successfully uploaded ${documentAssetIds.length} documents`,
        results
      };
    } else if (errors.length < documentAssetIds.length) {
      return {
        ok: true,
        message: `Uploaded ${documentAssetIds.length - errors.length} of ${documentAssetIds.length} documents with some errors`,
        errors,
        results
      };
    } else {
      return {
        ok: false,
        message: "Failed to upload all documents",
        errors,
        results
      };
    }
  } catch (error) {
    console.error("Error uploading multiple documents:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 