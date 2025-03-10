"use server";

import prisma from "@/lib/prisma";
import { sendSms } from "@/app/actions/sms/sendSms";
import bcrypt from "bcrypt";

export async function resendBulkSessionPassword({ slug }) {
  console.log("Starting resendBulkSessionPassword with slug:", slug);
  try {
    // Find the session and associated worker
    const session = await prisma.workerBulkSigningSession.findUnique({
      where: { slug },
      include: {
        foreignWorker: {
          select: {
            israelPhoneNumber: true,
          },
        },
      },
    });

    console.log("Found session:", {
      sessionId: session?.id,
      hasWorker: !!session?.foreignWorker,
      phoneNumber: session?.foreignWorker?.israelPhoneNumber,
    });

    if (!session) {
      console.log("No session found for slug:", slug);
      return {
        ok: false,
        message: "Session not found",
      };
    }

    if (!session.foreignWorker?.israelPhoneNumber) {
      console.log("No phone number found for worker");
      return {
        ok: false,
        message: "Worker has no phone number",
      };
    }

    // Generate new password
    const _password = String(Math.floor(1000 + Math.random() * 9000));
    const password = await bcrypt.hash(_password, 10);
    console.log("Generated new password (not hashed):", _password);

    // Update session with new password
    const updatedSession = await prisma.workerBulkSigningSession.update({
      where: { id: session.id },
      data: {
        password,
        isPasswordProtected: true,
        smsStatus: "PENDING",
        smsStatusAt: new Date(),
      },
    });
    console.log("Session updated:", updatedSession.id);

    // Send SMS with new password
    console.log("Sending SMS to:", session.foreignWorker.israelPhoneNumber);
    const isSuccess = await sendSms({
      phone: session.foreignWorker.israelPhoneNumber,
      message: `קוד חדש לחתימה על מסמכים: ${_password}\nקישור למסמכים: ${process.env.NEXT_PUBLIC_API_URL}/worker-documents/${slug}`,
    });
    console.log("SMS send result:", isSuccess);

    // Update session SMS status
    const finalUpdate = await prisma.workerBulkSigningSession.update({
      where: { id: session.id },
      data: {
        smsStatus: isSuccess ? "COMPLETED" : "FAILED",
        smsStatusAt: new Date(),
      },
    });
    console.log("Final session update:", finalUpdate.id);

    const response = {
      ok: isSuccess,
      message: isSuccess
        ? "New code sent successfully"
        : "Failed to send new code",
    };
    console.log("Returning response:", response);
    return response;
  } catch (error) {
    console.error("Error in resendBulkSessionPassword:", error);
    return {
      ok: false,
      message: error.message || "Failed to resend code",
    };
  }
}
