"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import sendSMS from "../sms/sendSMS";


const schema = z
  .object({
    userIds: z.array(z.string().min(1)).optional(),
    workerIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (data) =>
      (data.userIds && data.userIds.length > 0) ||
      (data.workerIds && data.workerIds.length > 0),
    {
      message: "נדרש לפחות משתמש אחד או עובד אחד",
    }
  );


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


    let { userIds, workerIds } = parsed.data;

    userIds = userIds || [];

    if (workerIds && workerIds.length > 0) {
      const workers = await prisma.worker.findMany({
        where: { id: { in: workerIds } },
        select: { userId: true },
      });
      userIds = [
        ...userIds,
        ...workers.filter((w) => w.userId).map((w) => w.userId),
      ];
    }

    // Remove duplicates
    userIds = Array.from(new Set(userIds));

    if (userIds.length === 0) {
      return { status: 400, message: "לא נמצאו משתמשים לשליחה" };
    }


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
