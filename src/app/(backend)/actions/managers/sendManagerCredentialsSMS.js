"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import sendSMS from "../sms/sendSMS";

const schema = z.object({
  managerId: z.string().min(1, "נדרש מזהה מנהל"),
});

const sendManagerCredentialsSMS = async (input) => {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        status: 400,
        message: "הנתונים שהוזנו אינם תקינים",
        errors: parsed.error.issues,
      };
    }

    const { managerId } = parsed.data;

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { user: true },
    });

    if (!manager || !manager.user) {
      return { status: 404, message: "המנהל לא נמצא" };
    }

    const phone = manager.phone || manager.user.phone;

    if (!phone) {
      return { status: 400, message: "לא קיים מספר טלפון לשליחה" };
    }

    const BASE_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://agriculture-hrms.vercel.app";
    const loginUrl = `${BASE_URL}/login`;

    const message = `שלום ${manager.name},\nפרטי הגישה שלך למערכת:\nשם משתמש: ${manager.user.username}\nסיסמה: 10203040 (אם לא שינית)\nקישור לכניסה: ${loginUrl}`;

    const smsSent = await sendSMS(
      phone,
      message,
      null,
      manager.clientId,
      manager.id,
      manager.user.organizationId,
      "ORGANIZATION",
      "MANAGER"
    );

    if (smsSent) {
      return { status: 200, message: "הפרטים נשלחו ב-SMS בהצלחה" };
    }
    return { status: 500, message: "שליחת ה-SMS נכשלה" };
  } catch (error) {
    console.error("Error sending manager credentials SMS:", error);
    return { status: 500, message: "שגיאה בשליחת ה-SMS", error: error.message };
  } finally {
    await prisma.$disconnect();
  }
};

export default sendManagerCredentialsSMS;
