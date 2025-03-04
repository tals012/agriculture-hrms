"use server";
	
import prisma from "@/lib/prisma";
import sendSMS from "../sms/sendSMS";
import bcrypt from "bcryptjs";

// Generates a random 5-digit password
function generateRandomPassword() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const sendRequestForAttendance = async (workerId, groupId) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        user: true,
        currentClient: true,
      },
    });

    if (!worker) {
      return { success: false, message: "Worker not found" };
    }

    if (!worker.primaryPhone) {
      return { success: false, message: "Worker does not have a phone number" };
    }

    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return { success: false, message: "Organization not found" };
    }

    let username = worker.passport;
    let password = generateRandomPassword();
    let userCreated = false;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (!worker.userId || !worker.user) {
      const newUser = await prisma.user.create({
        data: {
          name: worker.name || "Worker",
          username: username,
          password: hashedPassword,
          email: `${username}@placeholder.com`,
          role: "WORKER",
          organizationId: organization.id,
          worker: {
            connect: {
              id: workerId,
            },
          },
        },
      });

      userCreated = true;
    } else {
      username = worker.user.username;

      await prisma.user.update({
        where: { id: worker.userId },
        data: {
          password: hashedPassword,
        },
      });
    }

    const attendanceLink = `${process.env.NEXT_PUBLIC_APP_URL}/worker/attendance?groupId=${groupId}`;

    const message = `Your login credentials for attendance: Username: ${username}, Password: ${password}. Please complete your attendance at: ${attendanceLink}`;

    const smsResult = await sendSMS(
      worker.primaryPhone,
      message,
      workerId,
      organization.id,
      "ORGANIZATION",
      "WORKER"
    );

    if (!smsResult) {
      return {
        success: false,
        message: "Failed to send SMS",
      };
    }

    return {
      success: true,
      message: "Attendance request sent successfully",
    };
  } catch (error) {
    console.error("Error in sendRequestForAttendance:", error);
    return { success: false, message: error.message };
  }
}

export default sendRequestForAttendance;
