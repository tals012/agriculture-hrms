"use server";

import prisma from "@/lib/prisma";
import sendSms from "@/app/(backend)/actions/sms/sendSMS";
import bcrypt from "bcryptjs";

export async function resendPasswordForRemoteDoc({ slug, phone }) {
  console.log("Starting resendPasswordForRemoteDoc with slug:", slug);
  try {
    // Find the document and associated worker
    const document = await prisma.workerDocument.findFirst({
      where: { slug },
      include: {
        worker: {
          select: {
            primaryPhone: true,
          },
        },
      },
    });

    console.log("Found document:", {
      documentId: document?.id,
      hasWorker: !!document?.worker,
      phoneNumber: document?.worker?.primaryPhone,
    });

    if (!document) {
      console.log("No document found for slug:", slug);
      return {
        ok: false,
        message: "Document not found",
      };
    }

    // Generate new password
    const _password = String(Math.floor(1000 + Math.random() * 9000));
    const password = await bcrypt.hash(_password, 10);
    console.log("Generated new password (not hashed):", _password);

    // Update document with new password
    const updatedDocument = await prisma.workerDocument.update({
      where: { id: document.id },
      data: {
        remoteDocPassword: password,
        remoteDocSmsStatus: "PENDING",
        remoteDocSmsStatusAt: new Date(),
      },
    });
    console.log("Document updated:", updatedDocument.id);

    // Send SMS with new password
    console.log("Sending SMS to:", document.worker.primaryPhone);
    const isSuccess = await sendSms({
      phone: phone ?? document.worker.primaryPhone,
      message: `קוד חדש לחתימה על מסמכים: ${_password}\nקישור למסמכים: ${process.env.NEXT_PUBLIC_API_URL}/remote-signature/${slug}`,
    });
    console.log("SMS send result:", isSuccess);

    // Update document SMS status
    const finalUpdate = await prisma.workerDocument.update({
      where: { id: document.id },
      data: {
        remoteDocSmsStatus: isSuccess ? "COMPLETED" : "FAILED",
        remoteDocSmsStatusAt: new Date(),
      },
    });
    console.log("Final document update:", finalUpdate.id);

    const response = {
      ok: isSuccess,
      message: isSuccess
        ? "New code sent successfully"
        : "Failed to send new code",
    };
    console.log("Returning response:", response);
    return response;
  } catch (error) {
    console.error("Error in resendPasswordForRemoteDoc:", error);
    return {
      ok: false,
      message: error.message || "Failed to resend code",
    };
  }
}
