"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createFieldSchema = z.object({
  name: z.string().min(1, "Name is required"),
  typeOfProduct: z.string().min(1, "Type of product is required"),
  contactPhone: z.string().optional().nullable(),
  contactPersonName: z.string().optional().nullable(),
  additionalPhone: z.string().optional().nullable(),
  withholdingAccountNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  fieldTax: z.string().optional().nullable(),
  fieldCode: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  fieldOpenTime: z.number().optional().nullable(),
  fieldCloseTime: z.number().optional().nullable(),
  note: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  clientId: z.string().min(1, "Client ID is required"),
});

const createField = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = createFieldSchema.safeParse(payload);
    
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

    const clientExists = await prisma.client.findUnique({
      where: { id: parsedData.data.clientId },
    });

    if (!clientExists) {
      return {
        status: 404,
        message: "הלקוח לא נמצא",
        data: null,
      };
    }

    // Check if manager exists if managerId is provided
    if (parsedData.data.managerId) {
      const managerExists = await prisma.manager.findUnique({
        where: { id: parsedData.data.managerId },
      });

      if (!managerExists) {
        return {
          status: 404,
          message: "המנהל לא נמצא",
          data: null,
        };
      }
    }

    const newField = await prisma.field.create({
      data: parsedData.data,
      select: {
        id: true,
        serialNumber: true,
        name: true,
        typeOfProduct: true,
        contactPhone: true,
        contactPersonName: true,
        additionalPhone: true,
        withholdingAccountNumber: true,
        address: true,
        fieldTax: true,
        fieldCode: true,
        size: true,
        status: true,
        latitude: true,
        longitude: true,
        fieldOpenTime: true,
        fieldCloseTime: true,
        note: true,
        cityId: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      status: 201,
      message: "השדה נוצר בהצלחה",
      data: newField,
    };

  } catch (error) {
    console.error("Error creating field:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
}; 

export default createField;