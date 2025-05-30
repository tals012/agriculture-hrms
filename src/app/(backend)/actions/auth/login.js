  "use server";

  import { redirect } from "next/navigation";
  import { cookies } from "next/headers";
  import prisma from "@/lib/prisma";
  import bcrypt from "bcryptjs";
  import * as jose from "jose";

  export const login = async ({ username, password }) => {
    if (!username || !password) {
      return {
        ok: false,
        message: "יש למלא את כלל השדות",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user || !!user?.isDeleted) {
      return {
        ok: false,
        message: "לא נמצא משתמש קיים",
      };
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return {
        ok: false,
        message: "סיסמא שגויה",
      };
    }

    const jwtConfig = {
      secret: new TextEncoder().encode(process.env.JWT_SECRET),
    };
    const token = await new jose.SignJWT({
      id: user.id,
      role: user.role,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(jwtConfig.secret);

    cookies().set("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60
    });
    cookies().set("role", user.role || "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60
    });
    cookies().set("userId", user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60
    });

    return {
      ok: true,
      message: "התחברת בהצלחה",
      token,
      role: user.role || "",
      userId: user.id,
    };
  };
