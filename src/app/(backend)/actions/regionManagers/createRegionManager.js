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
  console.log("createRegionManager called with payload:", payload);

  try {
    if (!payload) {
    console.error("No payload provided to createRegionManager");
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
    console.log("Zod validation result:", parsedData.success);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      console.error("Validation errors:", formattedErrors);
      return {
        status: 400,
        message: "האימות נכשל",
        errors: formattedErrors,
        data: null,
      };
    }

    console.log("Looking for client with ID:", parsedData.data.clientId);
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
      console.error("Client not found with ID:", parsedData.data.clientId);
      return {
        status: 404,
        message: "הלקוח לא נמצא",
        data: null,
      };
    }

    console.log(
      "Checking for existing region manager with email:",
      parsedData.data.email
    );
    const existingRegionManager = await prisma.regionManager.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingRegionManager) {
      console.log("Region manager with email already exists:", parsedData.data.email);
      return {
        status: 409,
        message: "כתובת האימייל כבר בשימוש",
        data: null,
      };
    }

    // Check if a user with this email already exists
    console.log(
      "Checking for existing user with email:",
      parsedData.data.email
    );
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingUser) {
      console.log("User with email already exists:", parsedData.data.email);
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

    console.log("Looking for organization");
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.error("No organization found");
      return {
        status: 404,
        message: "לא קיים ארגון",
        data: null,
      };
    }

    console.log("Creating hashed password");
    const hashedPassword = await bcrypt.hash("systempassword123", SALT_ROUNDS);

    console.log("Starting transaction to create user and region manager");

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        console.log("Creating user...");
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

        console.log("Creating region manager...");
        const regionManagerData = {
          name: parsedData.data.name,
          email: parsedData.data.email,
          phone: parsedData.data.phone,
          clientId: parsedData.data.clientId,
          userId: user.id,
        };

        console.log("Region manager data:", regionManagerData);

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
      console.log("Transaction completed successfully");
    } catch (txError) {
      // Safe error logging - avoid directly passing error object to console.error
      console.error("Transaction error occurred");

      if (txError) {
        console.error("Error message:", txError.message || "Unknown error");

        if (txError.stack) {
          console.error("Error stack trace available");
        }
      } else {
        console.error("Received null/undefined error object");
      }

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
      console.log("Attempting to send SMS");
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
      console.log("SMS sent successfully");
    } catch (smsError) {
      console.error(
        "Failed to send SMS, but region manager was created:",
        smsError && smsError.message ? smsError.message : "Unknown SMS error"
      );
    }

    console.log("Returning success response");
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
