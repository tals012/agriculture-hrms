  "use server";

  import { redirect } from "next/navigation";
  import { cookies } from "next/headers";
  import prisma from "@/lib/prisma";
  import bcrypt from "bcrypt";
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
      // .setExpirationTime(process.env.JWT_EXPIRATION_TIME) // token expiration time, e.g: "1 day"
      .sign(jwtConfig.secret);

    cookies().set("token", token);
    cookies().set("role", user.role || "");
    cookies().set("userId", user.id);

    return {
      ok: true,
      message: "התחברת בהצלחה",
      token,
      role: user.role || "",
      userId: user.id,
    };
  };
