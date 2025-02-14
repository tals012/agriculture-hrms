"use server";

import prisma from "@/lib/prisma";
import z from "zod";

const getHarvestEntriesSchema = z.object({
  workerId: z.string().min(1),
  search: z.string().optional(),
});

export default async function getHarvestEntries({ payload }) {
  try {
    // * validate payload
    const validatedPayload = getHarvestEntriesSchema.safeParse(payload);

    if (!validatedPayload.success) {
      return {
        status: 400,
        message: "נתונים לא חוקיים",
      };
    }

    const { workerId, search } = validatedPayload.data;

    // * get harvest entries
    const harvestEntries = await prisma.harvestEntry.findMany({
      where: {
        workerId: workerId,
        OR: [
          {
            field: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            manager: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        field: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: 200,
      data: harvestEntries,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
    };
  }
} 