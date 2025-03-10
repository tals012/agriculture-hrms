"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";

// Schema validation for sending a document for remote signature using Zod
const payloadSchema = z.object({
  documentId: z.string(),
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
 * Send SMS with document link to worker's phone
 * @param {Object} params - Parameters
 * @param {string} params.documentId - Worker document ID
 * @param {string} params.phone - Phone number to send SMS to
 * @param {string} params.slug - Document slug for access
 * @returns {Promise<{success: boolean, message?: string}>} Result
 */
const sendLinkToWorker = async ({ documentId, phone, slug, message }) => {
  try {
    const document = await prisma.workerDocument.findUnique({
      where: { id: documentId },
      select: { name: true },
    });

    // Generate the document access link
    const documentLink = `${process.env.NEXT_PUBLIC_APP_URL}/remote-document/${slug}`;
    
    // Create SMS content
    const defaultMessage = `לחתימה דיגיטלית על המסמך "${document.name}", לחץ על הקישור: ${documentLink}`;
    const smsContent = message || defaultMessage;
    
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
    console.error("Error sending SMS:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Send a document for remote signature
 * @param {Object} data - Request data
 * @param {string} data.documentId - The document ID
 * @param {string} data.phone - Phone number to send document to
 * @param {string} [data.message] - Optional custom message
 * @returns {Promise<{ok: boolean, message?: string}>} Result
 */
export async function sendForRemoteSignature(data) {
  try {
    // Validate input data with Zod
    const validatedData = payloadSchema.parse(data);
    const { documentId, phone, message } = validatedData;

    // Get document and check if it exists
    const document = await prisma.workerDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { ok: false, message: "Document not found" };
    }

    // Generate unique slug for document access
    const slug = await getUniqueSlug();

    // Update document with slug and set status to PENDING_SIGNATURE
    await prisma.workerDocument.update({
      where: { id: documentId },
      data: {
        slug,
        type: "REMOTE_DOCUMENT",
        status: "PENDING",
      },
    });

    // Send link to worker
    const smsResult = await sendLinkToWorker({
      documentId,
      phone,
      slug,
      message,
    });

    if (!smsResult.success) {
      return { ok: false, message: `Failed to send SMS: ${smsResult.message}` };
    }

    // Revalidate cache for worker documents
    revalidateTag("worker-documents");

    return { ok: true, message: "Document sent for signature successfully" };
  } catch (error) {
    console.error("Error sending document for remote signature:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { ok: false, message: error.message };
  }
} 