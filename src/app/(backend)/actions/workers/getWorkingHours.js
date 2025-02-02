"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getWorkingHoursSchema = z.object({
  workerId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getWorkingHours = async (input = {}) => {
  try {
    const parsedData = getWorkingHoursSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "Invalid data provided",
        errors: formattedErrors,
      };
    }

    // Build where clause based on filters
    const where = {};

    if (parsedData.data.workerId) {
      where.workerId = parsedData.data.workerId;
    }

    if (parsedData.data.startDate || parsedData.data.endDate) {
      where.attendance = {
        date: {
          ...(parsedData.data.startDate && { gte: parsedData.data.startDate }),
          ...(parsedData.data.endDate && { lte: parsedData.data.endDate }),
        },
      };
    }

    // Fetch worker attendance records with all related data
    const workingHours = await prisma.workerAttendance.findMany({
      where,
      select: {
        id: true,
        startTimeInMinutes: true,
        endTimeInMinutes: true,
        breakTimeInMinutes: true,
        totalHoursWorked: true,
        totalHoursWorkedWindow100: true,
        totalHoursWorkedWindow125: true,
        totalHoursWorkedWindow150: true,
        totalContainersFilled: true,
        isBreakTimePaid: true,
        status: true,
        worker: {
          select: {
            id: true,
            nameHe: true,
          },
        },
        attendance: {
          include: {
            combination: {
              include: {
                harvestType: true,
                species: true,
              },
            },
            group: {
              include: {
                field: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          attendance: {
            date: 'desc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return {
      status: 200,
      message: "Working hours fetched successfully",
      data: workingHours,
    };

  } catch (error) {
    console.error("Error fetching working hours:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
};

export default getWorkingHours;
