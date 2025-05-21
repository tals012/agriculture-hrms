"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import sendSMS from "../sms/sendSMS";

const schema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "נדרשים משתמשים"),
});

const sendBulkCredentialsSMS = async (input) => {
  try {
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return {
        status: 400,
        message: "הנתונים שהוזנו אינם תקינים",
        errors: parsed.error.issues,
      };
    }

    const { userIds } = parsed.data;

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { worker: true },
    });

    const results = [];

    for (const user of users) {
      if (!user.worker || !user.worker.primaryPhone) {
        results.push({ userId: user.id, success: false, message: "לא נמצא מספר טלפון" });
        continue;
      }

      const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agriculture-hrms.vercel.app";
      const loginUrl = `${BASE_URL}/login`;

      const message = `שלום ${user.name || user.worker.nameHe || ""},\nפרטי הגישה שלך למערכת:\nשם משתמש: ${user.username}\nסיסמה: 10203040 (אם לא שינית)\nקישור לכניסה: ${loginUrl}`;

      const smsSent = await sendSMS(
        user.worker.primaryPhone,
        message,
        user.worker.id,
        null,
        null,
        user.organizationId,
        "ORGANIZATION",
        "WORKER"
      );

      results.push({ userId: user.id, success: smsSent });
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    const statusMessage =
      failureCount === 0
        ? "כל ההודעות נשלחו בהצלחה"
        : `נשלחו ${successCount} הודעות, ${failureCount} נכשלו`;

    return { status: 200, message: statusMessage, results };
  } catch (error) {
    console.error("Error sending bulk credentials SMS:", error);
    return {
      status: 500,
      message: "אירעה שגיאה בשליחת פרטי ההתחברות",
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default sendBulkCredentialsSMS;
