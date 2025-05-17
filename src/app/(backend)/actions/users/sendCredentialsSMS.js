"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import sendSMS from "../sms/sendSMS";

const schema = z.object({
  userId: z.string().min(1, "נדרש מזהה משתמש"),
});

const sendCredentialsSMS = async (input) => {
  try {
    const validatedInput = schema.safeParse(input);

    if (!validatedInput.success) {
      return {
        status: 400,
        message: "הנתונים שהוזנו אינם תקינים",
        errors: validatedInput.error.issues,
      };
    }

    const { userId } = validatedInput.data;

    // Fetch user with associated worker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        worker: true,
      },
    });

    if (!user) {
      return {
        status: 404,
        message: "המשתמש לא נמצא",
      };
    }

    if (!user.worker) {
      return {
        status: 400,
        message: "המשתמש אינו משויך לעובד",
      };
    }

    // Format and send the SMS
    const phoneNumber = user.worker.primaryPhone;

    if (!phoneNumber) {
      return {
        status: 400,
        message: "לא נמצא מספר טלפון לעובד",
      };
    }

    // Get the base URL from environment variables or use a default
    const BASE_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://agriculture-hrms.vercel.app";
    const loginUrl = `${BASE_URL}/login`;

    const message = `שלום ${user.name || user.worker.nameHe || ""},
פרטי הגישה שלך למערכת:
שם משתמש: ${user.username}
סיסמה: 10203040 (אם לא שינית)
קישור לכניסה: ${loginUrl}`;

    const smsResult = await sendSMS(
      phoneNumber,
      message,
      user.worker.id, // workerId
      null, // clientId
      null, // managerId
      user.organizationId, // organizationId
      "ORGANIZATION", // sentBy
      "WORKER" // sentTo
    );

    if (smsResult) {
      return {
        status: 200,
        message: "פרטי ההתחברות נשלחו בהצלחה",
      };
    } else {
      return {
        status: 500,
        message: "שליחת ה-SMS נכשלה, אנא נסה שוב מאוחר יותר",
      };
    }
  } catch (error) {
    console.error("Error sending credentials SMS:", error);
    return {
      status: 500,
      message: "אירעה שגיאה בשליחת פרטי ההתחברות",
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default sendCredentialsSMS;
