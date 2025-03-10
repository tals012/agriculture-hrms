"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";

// Schema validation for bulk document sending using Zod
const payloadSchema = z.object({
  documentIds: z.array(z.string()),
  phone: z.string(),
  message: z.string().optional(),
});

/**
 * Generate a unique slug for remote document access
 * @returns {Promise<string>} Unique slug
 */
const getUniqueSlug = async () => {
  const slug = nanoid(10);
  const existingDoc = await prisma.workerDocument.findFirst({
    where: { slug },
  });
  if (existingDoc) {
    return getUniqueSlug(); // Recursively try again if slug exists
  }
  return slug;
};

/**
 * Sends bulk SMS with document links to worker's phone
 * @param {Object} params - Parameters
 * @param {Array<string>} params.documentIds - Document IDs
 * @param {string} params.phone - Phone number to send SMS to
 * @param {Array<string>} params.slugs - Document slugs for access
 * @returns {Promise<{success: boolean, message?: string}>} Result
 */
const sendLinksToWorker = async ({ documentIds, phone, slugs, message }) => {
  try {
    // Get document names
    const documents = await prisma.workerDocument.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, name: true },
    });

    // Create a map of document IDs to names for efficient lookup
    const documentMap = documents.reduce((map, doc) => {
      map[doc.id] = doc.name;
      return map;
    }, {});

    // Generate document links with corresponding slugs
    const documentLinks = documentIds.map((docId, index) => {
      const documentName = documentMap[docId] || 'Document';
      const documentLink = `${process.env.NEXT_PUBLIC_APP_URL}/remote-document/${slugs[index]}`;
      return { name: documentName, link: documentLink };
    });

    // Create SMS content with all document links
    let smsContent;
    if (message) {
      smsContent = message;
    } else {
      const linksList = documentLinks.map(doc => `- ${doc.name}: ${doc.link}`).join('\n');
      smsContent = `לחתימה דיגיטלית על המסמכים הבאים:\n${linksList}`;
    }

    // Create SMS record in database
    const sms = await prisma.sMS.create({
      data: {
        content: smsContent,
        phone,
        status: "PENDING",
        sentBy: "SYSTEM",
        sentTo: "WORKER",
      },
    });

    // In a real implementation, you would call an SMS service here
    // For now, we'll just mark it as sent
    await prisma.sMS.update({
      where: { id: sms.id },
      data: { status: "SENT" },
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending bulk SMS:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Send multiple documents for remote signature
 * @param {Object} data - Request data
 * @param {Array<string>} data.documentIds - Array of document IDs
 * @param {string} data.phone - Phone number to send documents to
 * @param {string} [data.message] - Optional custom message
 * @returns {Promise<{ok: boolean, message?: string}>} Result
 */
export async function sendBulkRemoteSignature(data) {
  try {
    // Validate input data with Zod
    const validatedData = payloadSchema.parse(data);
    const { documentIds, phone, message } = validatedData;

    if (documentIds.length === 0) {
      return { ok: false, message: "No documents provided" };
    }

    // Check if all documents exist
    const documents = await prisma.workerDocument.findMany({
      where: { id: { in: documentIds } },
    });

    if (documents.length !== documentIds.length) {
      return { ok: false, message: "One or more documents not found" };
    }

    // Generate unique slugs for each document
    const slugs = await Promise.all(documentIds.map(() => getUniqueSlug()));

    // Update all documents with slugs and set status to PENDING_SIGNATURE
    await Promise.all(
      documentIds.map((docId, index) =>
        prisma.workerDocument.update({
          where: { id: docId },
          data: {
            slug: slugs[index],
            type: "REMOTE_DOCUMENT",
            status: "PENDING",
          },
        })
      )
    );

    // Send links to worker
    const smsResult = await sendLinksToWorker({
      documentIds,
      phone,
      slugs,
      message,
    });

    if (!smsResult.success) {
      return { ok: false, message: `Failed to send SMS: ${smsResult.message}` };
    }

    // Revalidate cache for worker documents
    revalidateTag("worker-documents");

    return {
      ok: true,
      message: `${documentIds.length} documents sent for signature successfully`,
    };
  } catch (error) {
    console.error("Error sending documents for remote signature:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 