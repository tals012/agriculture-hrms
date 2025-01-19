"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createWorkerSchema = z.object({
  nameHe: z.string().min(1, "שם בעברית הוא שדה חובה"),
  surnameHe: z.string().min(1, "שם משפחה בעברית הוא שדה חובה"),
  sex: z.enum(["MALE", "FEMALE"], "מין הוא שדה חובה"),
  birthday: z.date({
    required_error: "תאריך לידה הוא שדה חובה",
    invalid_type_error: "תאריך לידה לא תקין",
  }),
  primaryPhone: z.string().min(1, "טלפון ראשי הוא שדה חובה"),
  passport: z.string().min(1, "דרכון הוא שדה חובה"),
  countryId: z.string().min(1, "מדינה היא שדה חובה"),
  cityId: z.string().min(1, "עיר היא שדה חובה"),
  clientId: z.string().min(1, "לקוח הוא שדה חובה"),
});

const createWorker = async ({ payload }) => {
  try {
    if (!payload) {
      return {
        status: 400,
        message: "לא התקבלו נתונים",
      };
    }

    const validation = createWorkerSchema.safeParse(payload);

    if (!validation.success) {
      const { errors } = validation.error;
      return {
        status: 400,
        message: errors[0].message,
      };
    }

    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
    });

    if (!client) {
      return {
        status: 400,
        message: "הלקוח לא נמצא",
      };
    }

    const worker = await prisma.worker.create({
      data: {
        ...payload,
        workerStatus: "ACTIVE",
      },
    });

    return {
      status: 201,
      message: "העובד נוצר בהצלחה",
      data: worker,
    };
  } catch (error) {
    console.log(error.stack);
    return {
      status: 500,
      message: "שגיאה בשרת",
    };
  }
};

export default createWorker; 