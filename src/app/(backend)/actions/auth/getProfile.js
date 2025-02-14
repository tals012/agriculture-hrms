"use server";
import prisma from "@/lib/prisma";
import * as jose from "jose";

const getProfile = async ({ token }) => {
  try {
    const jwtConfig = {
      secret: new TextEncoder().encode(process.env.JWT_SECRET),
    };
    const decoded = await jose.jwtVerify(token, jwtConfig.secret);

    if (!decoded) {
      return {
        status: 400,
        message: "טוקן לא תקין",
        data: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.payload?.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
        phone: true,
        role: true,
        username: true,
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      status: 200,
      message: "הפרופיל נטען בהצלחה",
      data: user,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  }
};

export default getProfile;
