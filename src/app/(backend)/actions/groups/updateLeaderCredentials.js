"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const schema = z.object({
  userId: z.string().min(1, "נדרש מזהה משתמש"),
  username: z.string().min(1, "נדרש שם משתמש"),
  password: z.string().optional(),
});

const updateLeaderCredentials = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: parsedData.error.issues,
      };
    }

    const { userId, username, password } = parsedData.data;

    // Check if username already exists (excluding the current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: userId,
        },
      },
    });

    if (existingUser) {
      return {
        status: 400,
        message: "שם המשתמש כבר קיים במערכת, נא לבחור שם אחר",
      };
    }

    // Prepare update data
    const updateData = {
      username,
    };

    // Add password to update data if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      updateData.password = hashedPassword;
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      status: 200,
      message: "פרטי ההתחברות עודכנו בהצלחה",
    };
  } catch (error) {
    console.error("שגיאה בעדכון פרטי התחברות:", error);
    return {
      status: 500,
      message: error.message || "שגיאת שרת פנימית",
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default updateLeaderCredentials;
