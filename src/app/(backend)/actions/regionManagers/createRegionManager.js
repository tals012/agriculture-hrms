"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import sendSMS from "../sms/sendSMS";

const SALT_ROUNDS = 10;

const createRegionManagerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

const createRegionManager = async (payload) => {

  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    // Ensure clientId is a string
    if (payload.clientId && typeof payload.clientId !== "string") {
      payload.clientId = String(payload.clientId);
    }

  const parsedData = createRegionManagerSchema.safeParse(payload);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        status: 400,
        message: "האימות נכשל",
        errors: formattedErrors,
        data: null,
      };
    }

    const client = await prisma.client.findUnique({
      where: { id: parsedData.data.clientId },
      include: {
        regionManagers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!client) {
      return {
        status: 404,
        message: "הלקוח לא נמצא",
        data: null,
      };
    }

    const existingRegionManager = await prisma.regionManager.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingRegionManager) {
      return {
        status: 409,
        message: "כתובת האימייל כבר בשימוש",
        data: null,
      };
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingUser) {
      return {
        status: 409,
        message: "כתובת האימייל כבר בשימוש במערכת עבור משתמש אחר",
        data: null,
      };
    }

    const firstName = parsedData.data.name.split(" ")[0].toLowerCase();

    let username = firstName;
    let counter = 1;
    while (true) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (!existingUser) break;
      username = `${firstName}${counter}`;
      counter++;
    }

    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return {
        status: 404,
        message: "לא קיים ארגון",
        data: null,
      };
    }

    const hashedPassword = await bcrypt.hash("systempassword123", SALT_ROUNDS);


    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: parsedData.data.name,
            username,
            email: parsedData.data.email,
            password: hashedPassword,
            phone: parsedData.data.phone,
            role: "REGION_MANAGER",
            organizationId: organization.id,
          },
        });

        const regionManagerData = {
          name: parsedData.data.name,
          email: parsedData.data.email,
          phone: parsedData.data.phone,
          clientId: parsedData.data.clientId,
          userId: user.id,
        };


        const regionManager = await tx.regionManager.create({
          data: regionManagerData,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            clientId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { user, regionManager };
      });
    } catch (txError) {

      // Re-throw a new error with a clear message
      throw new Error(
        "Failed to create user/region manager: " +
          (txError && txError.message
            ? txError.message
            : "Unknown transaction error")
      );
    }

    // If we get here, the transaction was successful
    let message = `Your login credentials for the system: Username: ${username}, Password: systempassword123. Please complete your login at: ${process.env.NEXT_PUBLIC_APP_URL}/login`;

    // Try to send SMS but don't let it fail the whole operation
    try {
      await sendSMS(
        result.regionManager.phone,
        message,
        null,
        client.id,
        result.regionManager.id,
        organization.id,
        "ORGANIZATION",
        "MANAGER"
      );
    } catch (smsError) {
    }

    return {
      status: 201,
      message: "חשבון מנהל האזור והמשתמש נוצרו בהצלחה",
      data: result.regionManager,
    };
  } catch (error) {
    // Safe error logging
    console.error(
      "Error creating region manager:",
      error && error.message ? error.message : "Unknown error"
    );

    if (error && error.stack) {
      console.error("Error occurred with stack trace available");
    }

    if (error && error.code === "P2002") {
      return {
        status: 409,
        message:
          "הפרה של אילוץ ייחודיות. ייתכן שהאימייל או שם המשתמש כבר בשימוש",
        data: null,
      };
    }

    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error && error.message ? error.message : "Unknown error",
      data: null,
    };
  }
};

export default createRegionManager;
