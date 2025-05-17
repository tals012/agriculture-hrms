"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1, "נדרש מזהה משתמש"),
});

const getUserById = async (input) => {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        organizationId: true,
        // Don't include password hash in the response
      },
    });

    if (!user) {
      return {
        status: 404,
        message: "המשתמש לא נמצא",
      };
    }

    return {
      status: 200,
      message: "המשתמש נטען בהצלחה",
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      status: 500,
      message: "אירעה שגיאה בטעינת נתוני המשתמש",
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getUserById;
