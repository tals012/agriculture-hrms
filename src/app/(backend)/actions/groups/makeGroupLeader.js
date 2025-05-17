"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import sendSMS from "../sms/sendSMS";

const SALT_ROUNDS = 10;

const schema = z.object({
  groupId: z.string().min(1, "נדרש מזהה קבוצה"),
  workerId: z.string().min(1, "נדרש מזהה עובד"),
});

const makeGroupLeader = async (input) => {
  try {
    const parsedData = schema.safeParse(input);

    if (!parsedData.success) {
      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: parsedData.error.issues,
      };
    }

    const { groupId, workerId } = parsedData.data;
    let createdUserId = null;
    let userCreated = false;

    await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: {
          members: {
            include: {
              worker: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!group) {
        throw new Error("הקבוצה לא נמצאה");
      }

      const worker = await tx.worker.findUnique({
        where: { id: workerId },
        include: {
          user: true,
        },
      });

      if (!worker) {
        throw new Error("העובד לא נמצא");
      }

      const currentLeaders = group.members.filter(
        (member) => member.isGroupLeader
      );
      for (const leader of currentLeaders) {
        if (leader.worker.userId) {
          await tx.user.delete({
            where: { id: leader.worker.userId },
          });
        }
      }

      await tx.groupMember.updateMany({
        where: {
          groupId,
          isGroupLeader: true,
        },
        data: {
          isGroupLeader: false,
        },
      });

      if (!worker.userId) {
        const organization = await tx.organization.findFirst();
        if (!organization) {
          throw new Error("לא קיים ארגון");
        }

        const firstName = (worker.name || worker.nameHe || "user")
          .split(" ")[0]
          .toLowerCase();
        let username = firstName;
        let counter = 1;
        while (true) {
          const existingUser = await tx.user.findUnique({
            where: { username },
          });
          if (!existingUser) break;
          username = `${firstName}${counter}`;
          counter++;
        }

        const hashedPassword = await bcrypt.hash("10203040", SALT_ROUNDS);

        const user = await tx.user.create({
          data: {
            name: worker.name || worker.nameHe || "",
            username,
            email: worker.email || `${username}@system.local`,
            password: hashedPassword,
            phone: worker.primaryPhone,
            role: "GROUP_LEADER",
            organizationId: organization.id,
          },
        });

        createdUserId = user.id;
        userCreated = true;

        await tx.worker.update({
          where: { id: workerId },
          data: { userId: user.id },
        });
      }

      const existingMember = group.members.find(
        (member) => member.workerId === workerId
      );

      if (existingMember) {
        await tx.groupMember.update({
          where: { id: existingMember.id },
          data: {
            isGroupLeader: true,
          },
        });
      } else {
        await tx.groupMember.create({
          data: {
            groupId,
            workerId,
            isGroupLeader: true,
            startDate: new Date(),
          },
        });
      }
    });

    // If a new user was created, send an SMS with the credentials
    if (userCreated && createdUserId) {
      try {
        // Get the worker with their phone number
        const worker = await prisma.worker.findUnique({
          where: { id: workerId },
          select: {
            primaryPhone: true,
            nameHe: true,
            name: true,
            user: {
              select: {
                username: true,
                organizationId: true,
              },
            },
          },
        });

        if (worker && worker.primaryPhone && worker.user) {
          // Get the base URL from environment variables or use a default
          const BASE_URL =
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://agriculture-hrms.vercel.app";
          const loginUrl = `${BASE_URL}/login`;

          // Send SMS with login credentials
          const message = `שלום ${worker.name || worker.nameHe || ""},
פרטי הגישה שלך למערכת:
שם משתמש: ${worker.user.username}
סיסמה: 10203040
קישור לכניסה: ${loginUrl}`;

          await sendSMS(
            worker.primaryPhone,
            message,
            workerId,
            null,
            null,
            worker.user.organizationId,
            "ORGANIZATION",
            "WORKER"
          );
        }
      } catch (smsError) {
        console.error("Error sending SMS with credentials:", smsError);
        // We don't throw here to avoid failing the entire operation
      }
    }

    return {
      status: 200,
      message: "מנהל הקבוצה עודכן בהצלחה",
    };
  } catch (error) {
    console.error("שגיאה בעדכון מנהל הקבוצה:", error);
    return {
      status: 500,
      message: error.message || "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default makeGroupLeader;
