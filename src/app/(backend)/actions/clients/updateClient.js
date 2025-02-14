"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const updateClientSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  nameEnglish: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  secondaryPhone: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  openingDate: z.date().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  licenseExist: z.boolean().optional().nullable(),
  licenseFromDate: z.date().optional().nullable(),
  licenseToDate: z.date().optional().nullable(),
  businessGovId: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
  accountantPhone: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().nullable(),
  note: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
});

const updateClient = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = updateClientSchema.safeParse(payload);
    
    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "אימות נכשל",
        errors: formattedErrors,
        data: null,
      };
    }

    const { id, ...updateData } = parsedData.data;

    const clientExists = await prisma.client.findUnique({
      where: { id },
    });

    if (!clientExists) {
      return {
        status: 404,
        message: "הלקוח לא נמצא",
        data: null,
      };
    }

    const updateDataNotNull = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== null)
    );

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateDataNotNull,
    });

    return {
      status: 200,
      message: "הלקוח עודכן בהצלחה",
      data: updatedClient,
    };
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        status: 409,
        message: "קיימת התנגשות עם ערכים ייחודיים. בדוק את האימייל או שדות ייחודיים אחרים.",
        data: null,
      };
    }

    console.error("Error updating client:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
};

export default updateClient;
