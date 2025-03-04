"use server";
import prisma from "@/lib/prisma";

export const getSMS = async (page = 1, pageSize = 10, search = "") => {
  try {
    const skipAmount = (page - 1) * pageSize;

    const whereCondition = search
      ? {
        OR: [
          { message: { contains: search, mode: "insensitive" } },
          {
            worker: { nameHe: { contains: search, mode: "insensitive" } },
          },
          { worker: { surnameHe: { contains: search, mode: "insensitive" } } },
        ],
      }
      : {};

    const smsEntries = await prisma.workerSMS.findMany({
      where: whereCondition,
      skip: skipAmount,
      take: pageSize,
      select: {
        id: true,
        sentAt: true,
        readAt: true,
        message: true,
        status: true,
        failureReason: true, // Ensure this is being selected
        worker: {
          select: {
            serialNumber: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    const total = await prisma.workerSMS.count({ where: whereCondition });

    return {
      data: smsEntries,
      total,
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return {
      message: error.message || "An error occurred while fetching SMS entries.",
      status: 500,
    };
  }
};
