"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getWorkerByIdSchema = z.object({
  workerId: z.string(),
});

const getWorkerById = async ({ payload }) => {
  try {
    const parsedData = getWorkerByIdSchema.safeParse(payload);
    if (!parsedData.success) {
      return {
        status: 400,
        message: parsedData.error.errors.map((e) => e.message).join(", "),
        data: null,
      };
    }

    const { workerId } = parsedData.data;

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        country: {
          select: {
            id: true,
            nameInHebrew: true,
            nameInEnglish: true,
            code: true,
          },
        },
        city: {
          select: {
            id: true,
            nameInHebrew: true,
            nameInEnglish: true,
            cityCode: true,
          },
        },
        currentClient: {
          select: {
            id: true,
            name: true,
          },
        },
        groups: {
          select: {
            id: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        harvestEntries: {
          select: {
            id: true,
            entryTime: true,
            exitTime: true,
            containersFilled: true,
            productivityIndicator: true,
            bonus: true,
            verificationPhoto: true,
            harvest: {
              select: {
                id: true,
                harvestType: true,
                species: true,
                field: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            entryTime: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!worker) {
      return {
        status: 404,
        message: "Worker not found",
        data: null,
      };
    }

    return {
      status: 200,
      message: "Worker fetched successfully",
      data: worker,
    };
  } catch (error) {
    console.error("Error fetching worker:", error.stack);
    return {
      status: 500,
      message: "Internal server error",
      data: null,
    };
  }
};

export default getWorkerById; 