"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import sendSMS from "../sms/sendSMS";

const schema = z.object({
  regionManagerId: z.string().min(1, "נדרש מזהה מנהל אזור"),
  password: z.string().optional(),
});

const sendRegionManagerCredentialsSMS = async (input) => {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        status: 400,
        message: "הנתונים שהוזנו אינם תקינים",
        errors: parsed.error.issues,
      };
    }

    const { regionManagerId, password } = parsed.data;

    const regionManager = await prisma.regionManager.findUnique({
      where: { id: regionManagerId },
      include: { user: true },
    });

    if (!regionManager || !regionManager.user) {
      return { status: 404, message: "מנהל האזור לא נמצא" };
    }

    const phone = regionManager.phone || regionManager.user.phone;

    if (!phone) {
      return { status: 400, message: "לא קיים מספר טלפון לשליחה" };
    }

    const BASE_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://agriculture-hrms.vercel.app";
    const loginUrl = `${BASE_URL}/login`;

    const message = `שלום ${regionManager.name},\nפרטי הגישה שלך למערכת:\nשם משתמש: ${regionManager.user.username}\nסיסמה: ${password || "10203040 (אם לא שינית)"}\nקישור לכניסה: ${loginUrl}`;

    const smsSent = await sendSMS(
      phone,
      message,
      null,
      regionManager.clientId,
      regionManager.id,
      regionManager.user.organizationId,
      "ORGANIZATION",
      "MANAGER"
    );

    if (smsSent) {
      return { status: 200, message: "הפרטים נשלחו ב-SMS בהצלחה" };
    }
    return { status: 500, message: "שליחת ה-SMS נכשלה" };
  } catch (error) {
    console.error("Error sending region manager credentials SMS:", error);
    return { status: 500, message: "שגיאה בשליחת ה-SMS", error: error.message };
  } finally {
    await prisma.$disconnect();
  }
};

export default sendRegionManagerCredentialsSMS;
