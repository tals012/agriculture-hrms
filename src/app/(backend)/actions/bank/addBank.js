"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function addBank({ bankId, hebrewName, englishName }) {
  try {
    // Check if bank already exists
    const existingBank = await prisma.bank.findFirst({
      where: {
        bankId: bankId,
      },
    });

    if (existingBank) {
      return {
        status: 400,
        message: "בנק עם מספר זה כבר קיים במערכת",
      };
    }

    // Create new bank
    const newBank = await prisma.bank.create({
      data: {
        bankId,
        hebrewName,
        englishName,
      },
    });

    return {
      status: 200,
      message: "הבנק נוסף בהצלחה",
      data: newBank,
    };
  } catch (error) {
    console.error("Error adding bank:", error);
    return {
      status: 500,
      message: "שגיאה בהוספת בנק חדש",
    };
  } finally {
    await prisma.$disconnect();
  }
}
