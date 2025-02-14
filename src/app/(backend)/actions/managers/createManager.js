"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const createManagerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

const createManager = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = createManagerSchema.safeParse(payload);
    
    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
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
        managers: {
          include: {
            user: true
          }
        }
      }
    });

    if (!client) {
      return {
        status: 404,
        message: "הלקוח לא נמצא",
        data: null,
      };
    }

    const existingManager = await prisma.manager.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingManager) {
      return {
        status: 409,
        message: "כתובת האימייל כבר בשימוש",
        data: null,
      };
    }

    const firstName = parsedData.data.name.split(' ')[0].toLowerCase();

    let username = firstName;
    let counter = 1;
    while (true) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
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

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsedData.data.name,
          username,
          email: parsedData.data.email,
          password: hashedPassword,
          phone: parsedData.data.phone,
          role: "FIELD_MANAGER",
          organizationId: organization.id,
        },
      });

      const manager = await tx.manager.create({
        data: {
          ...parsedData.data,
          userId: user.id,
        },
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

      return { user, manager };
    });

    return {
      status: 201,
      message: "חשבון המנהל והמשתמש נוצרו בהצלחה",
      data: result.manager,
    };

  } catch (error) {
    console.error("Error creating manager:", error);
    
    if (error.code === 'P2002') {
      return {
        status: 409,
        message: "הפרה של אילוץ ייחודיות. ייתכן שהאימייל או שם המשתמש כבר בשימוש",
        data: null,
      };
    }

    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
};

export default createManager; 