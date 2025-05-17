"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function addBranch({ branchId, hebrewName, bankId }) {
  try {
    // Check if branch already exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        branchId: branchId,
        ...(bankId ? { bankId: bankId } : {}),
      },
    });

    if (existingBranch) {
      return {
        status: 400,
        message: "סניף עם מספר זה כבר קיים במערכת",
      };
    }

    // Create new branch
    const newBranch = await prisma.branch.create({
      data: {
        branchId,
        hebrewName,
        ...(bankId ? { bankId: bankId } : {}),
      },
    });

    return {
      status: 200,
      message: "הסניף נוסף בהצלחה",
      data: newBranch,
    };
  } catch (error) {
    console.error("Error adding branch:", error);
    return {
      status: 500,
      message: "שגיאה בהוספת סניף חדש",
    };
  } finally {
    await prisma.$disconnect();
  }
}
