"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const updateWorkerSchema = z.object({
  workerId: z.string().min(1, { message: "נדרש מזהה עובד" }),
  name: z.string().optional(1, { message: "נדרש שם" }).nullable(),
  surname: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  nameSpouse: z.string().optional().nullable(),
  nameHe: z.string().optional().nullable(),
  surnameHe: z.string().optional().nullable(),
  primaryPhone: z.string().optional(1, { message: "נדרש טלפון ראשי" }).nullable(),
  secondaryPhone: z.string().optional().nullable(),
  email: z.string().email({ message: "פורמט אימייל לא תקין" }).optional().nullable(),
  address: z.string().optional().nullable(),
  sex: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional().nullable(),
  primaryLanguage: z.string().optional().nullable(),
  primaryLanguages: z.array(z.string()).optional().nullable(),
  secondaryLanguage: z.string().optional().nullable(),
  secondaryLanguages: z.array(z.string()).optional().nullable(),
  additionalLanguages: z.array(z.string()).optional().nullable(),
  countryArea: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  workerStatus: z.enum(["ACTIVE", "INACTIVE", "FREEZE", "COMMITTEE", "HIDDEN", "IN_TRANSIT"]).optional().nullable(),
  company: z.string().optional().nullable(),
  metapelCode: z.string().optional().nullable(),
  passport: z.string().optional().nullable(),
  passportValidity: z.coerce.date().optional().nullable(),
  visa: z.string().optional().nullable(),
  visaValidity: z.coerce.date().optional().nullable(),
  inscriptionDate: z.coerce.date().optional().nullable(),
  entryDate: z.coerce.date().optional().nullable(),
  favoritePlace: z.string().optional().nullable(),
  favoriteSex: z.string().optional().nullable(),
  partnerPlace: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  bankId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  apartment: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
});

const updateWorker = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא סופק מידע",
        data: null,
      };
    }

    const parsedData = updateWorkerSchema.safeParse(payload);
    
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

    const { workerId, ...updateData } = parsedData.data;

    // Check if worker exists
    const existingWorker = await prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!existingWorker) {
      return {
        status: 404,
        message: "העובד לא נמצא",
        data: null,
      };
    }

    // Check if passport is being updated and if it's already in use by another worker
    if (updateData.passport && updateData.passport !== existingWorker.passport) {
      const workerWithPassport = await prisma.worker.findFirst({
        where: { 
          AND: [
            { passport: updateData.passport },
            { id: { not: workerId } }
          ]
        },
      });

      if (workerWithPassport) {
        return {
          status: 400,
          message: "קיים כבר עובד עם דרכון זה",
          data: null,
        };
      }
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: updateData,
      include: {
        country: {
          select: {
            nameInHebrew: true,
            nameInEnglish: true,
          },
        },
        city: {
          select: {
            nameInHebrew: true,
            nameInEnglish: true,
          },
        },
      },
    });

    return {
      status: 200,
      message: "העובד עודכן בהצלחה",
      data: updatedWorker,
    };
  } catch (error) {
    console.error("Error updating worker:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
};

export default updateWorker; 