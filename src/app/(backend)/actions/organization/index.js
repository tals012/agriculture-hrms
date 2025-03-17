"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const organizationSchema = z.object({
  name: z.string().min(1, "שם הארגון הוא שדה חובה"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  internalOrganizationId: z.string().optional().nullable(),
});

export async function getOrganization() {
  try {
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      return {
        status: 404,
        message: "לא נמצא ארגון",
      };
    }

    return {
      status: 200,
      data: organization,
      ok: true,
    };
  } catch (error) {
    console.error("Error getting organization:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
}

export async function updateOrganization(input) {
  try {
    const parsedData = organizationSchema.safeParse(input);
    if (!parsedData.success) {
      return {
        status: 400,
        message: "המידע שהוזן אינו תקין",
        errors: parsedData.error.errors,
      };
    }

    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      return {
        status: 404,
        message: "לא נמצא ארגון",
      };
    }

    const updatedOrganization = await prisma.organization.update({
      where: {
        id: organization.id,
      },
      data: parsedData.data,
    });

    return {
      status: 200,
      message: "הארגון עודכן בהצלחה",
      data: updatedOrganization,
    };
  } catch (error) {
    console.error("Error updating organization:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
} 