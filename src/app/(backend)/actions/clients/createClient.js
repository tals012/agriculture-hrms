"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1, { message: "שם נדרש" }),
  nameEnglish: z.string().optional(),
  email: z.string().email({ message: "פורמט אימייל לא תקין" }),
  phone: z.string().min(1, { message: "טלפון נדרש" }),
  secondaryPhone: z.string().optional(),
  logo: z.string().optional(),
  openingDate: z.date().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.date().optional(),
  businessGovId: z.string().optional(),
  fax: z.string().optional(),
  accountantPhone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  note: z.string().optional(),
  cityId: z.string().optional(),
});

const createClient = async ({ payload }) => {
  try {
    const parsedData = createClientSchema.safeParse(payload);
    if (!parsedData.success) {
      return {
        status: 400,
        message: parsedData.error.errors.map((e) => e.message).join(", "),
        data: null,
      };
    }

    const client = await prisma.client.findFirst({
      where: {
        OR: [{ email: payload.email }, { phone: payload.phone }],
      },
    });

    if (client) {
      return {
        status: 200,
        message: "לקוח כבר קיים במערכת",
        clientId: client.id,
      };
    }

    const newClient = await prisma.client.create({
      data: {
        ...parsedData.data,
        status: parsedData.data.status || "ACTIVE",
      },
    });

    return {
      status: 201,
      message: "לקוח נוצר בהצלחה",
      clientId: newClient.id,
    };
  } catch (error) {
    console.error("Error creating client:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
    };
  }
};

export default createClient;
