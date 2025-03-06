"use server";
import prisma from "@/lib/prisma";
import * as jose from "jose";

const getProfile = async ({ token }) => {
  console.log("getProfile called with token:", token?.slice(0, 10) + "...");

  try {
    if (!token) {
      console.log("No token provided");
      return {
        status: 401,
        message: "No token provided",
        data: null,
      };
    }

    const jwtConfig = {
      secret: new TextEncoder().encode(process.env.JWT_SECRET),
    };

    let decoded;
    try {
      console.log("Attempting to verify token");
      decoded = await jose.jwtVerify(token, jwtConfig.secret);
      console.log("Token verified, payload:", decoded.payload);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return {
        status: 401,
        message: "Invalid token",
        data: null,
      };
    }

    if (!decoded?.payload?.id) {
      console.log("Invalid token payload - no user ID");
      return {
        status: 401,
        message: "Invalid token payload",
        data: null,
      };
    }

    console.log("Fetching user with ID:", decoded.payload.id);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.payload.id,
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
            surname: true,
            nameHe: true,
            surnameHe: true,
            passport: true,
            primaryPhone: true,
          },
        },
      },
    });

    if (!user) {
      console.log("User not found in database");
      return {
        status: 404,
        message: "User not found",
        data: null,
      };
    }

    console.log("User found:", { id: user.id, role: user.role });
    return {
      status: 200,
      message: "Profile loaded successfully",
      data: user,
    };
  } catch (error) {
    console.error("Server error in getProfile:", error);
    return {
      status: 500,
      message: "Internal server error",
      data: null,
    };
  }
};

export default getProfile;
