"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  managerId: z.string().min(1, "נדרש מזהה מנהל"),
});

function generatePassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const resetManagerPassword = async (input) => {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { status: 400, message: "הנתונים שהוזנו אינם תקינים", errors: parsed.error.issues };
    }

    const { managerId } = parsed.data;

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { user: true },
    });

    if (!manager || !manager.user) {
      return { status: 404, message: "המנהל לא נמצא" };
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: manager.userId },
      data: { password: hashedPassword },
    });

    return { status: 200, password };
  } catch (error) {
    console.error("Error resetting manager password:", error);
    return { status: 500, message: "שגיאה ביצירת סיסמה", error: error.message };
  } finally {
    await prisma.$disconnect();
  }
};

export default resetManagerPassword;
