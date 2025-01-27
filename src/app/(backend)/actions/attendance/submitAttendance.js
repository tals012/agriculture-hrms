"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const submitAttendanceSchema = z.object({
  administratorName: z.string().min(1, "Administrator name is required"),
  date: z.date(),
  combinationId: z.string().min(1, "Combination ID is required"),
  issues: z.array(z.string()),
  groupId: z.string().min(1, "Group ID is required"),
  managerId: z.string().optional(),
  workersAttendance: z.array(z.object({
    workerId: z.string().min(1, "Worker ID is required"),
    containersFilled: z.number().min(0, "Containers filled must be a positive number"),
  })),
});

const submitAttendance = async (input) => {
  try {
    const parsedData = submitAttendanceSchema.safeParse(input);

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

    // Get the group with its field to access working hours
    const group = await prisma.group.findUnique({
      where: { id: parsedData.data.groupId },
      include: {
        field: true,
      },
    });

    if (!group || !group.field) {
      return {
        status: 404,
        message: "Group or associated field not found",
      };
    }

    // Get the pricing combination to calculate wages
    const pricingCombination = await prisma.clientPricingCombination.findUnique({
      where: { id: parsedData.data.combinationId },
    });

    if (!pricingCombination) {
      return {
        status: 404,
        message: "Pricing combination not found",
      };
    }

    // Verify all workers exist
    const workerIds = parsedData.data.workersAttendance.map(w => w.workerId);
    const existingWorkers = await prisma.worker.findMany({
      where: {
        id: {
          in: workerIds
        }
      },
      select: {
        id: true
      }
    });

    const existingWorkerIds = new Set(existingWorkers.map(w => w.id));
    const invalidWorkerIds = workerIds.filter(id => !existingWorkerIds.has(id));

    if (invalidWorkerIds.length > 0) {
      return {
        status: 400,
        message: "Some workers do not exist",
        errors: invalidWorkerIds.map(id => ({
          field: 'workerId',
          message: `Worker with ID ${id} not found`
        }))
      };
    }

    // Calculate total work hours for the field
    const totalWorkHours = (group.field.fieldCloseTime - group.field.fieldOpenTime) / 60; // Convert minutes to hours

    // Calculate total containers and wages for each worker based on container norm
    const workersWithWages = parsedData.data.workersAttendance.map(worker => {
      // If no container norm is set, use direct multiplication and full hours
      if (!pricingCombination.containerNorm) {
        const startTime = new Date(parsedData.data.date);
        startTime.setHours(Math.floor(group.field.fieldOpenTime / 60));
        startTime.setMinutes(group.field.fieldOpenTime % 60);

        const endTime = new Date(parsedData.data.date);
        endTime.setHours(Math.floor(group.field.fieldCloseTime / 60));
        endTime.setMinutes(group.field.fieldCloseTime % 60);

        return {
          ...worker,
          totalWage: worker.containersFilled * pricingCombination.price,
          hoursWorked: totalWorkHours,
          startTime,
          endTime,
        };
      }

      // Calculate performance ratio against the norm
      const performanceRatio = worker.containersFilled / pricingCombination.containerNorm;
      
      // Calculate wage based on performance ratio
      const totalWage = pricingCombination.price * performanceRatio;

      // Calculate worked hours based on performance ratio
      const hoursWorked = totalWorkHours * performanceRatio;

      // Calculate start and end times based on performance ratio
      const startTime = new Date(parsedData.data.date);
      startTime.setHours(Math.floor(group.field.fieldOpenTime / 60));
      startTime.setMinutes(group.field.fieldOpenTime % 60);

      const endTime = new Date(parsedData.data.date);
      const totalMinutesWorked = hoursWorked * 60;
      const endTimeMinutes = group.field.fieldOpenTime + totalMinutesWorked;
      endTime.setHours(Math.floor(endTimeMinutes / 60));
      endTime.setMinutes(endTimeMinutes % 60);

      return {
        ...worker,
        totalWage,
        hoursWorked,
        startTime,
        endTime,
      };
    });

    // Calculate total income and containers
    const totalContainersFilled = workersWithWages.reduce(
      (sum, worker) => sum + worker.containersFilled,
      0
    );
    const totalIncome = workersWithWages.reduce(
      (sum, worker) => sum + worker.totalWage,
      0
    );

    // Create the group attendance record with worker attendance
    const attendance = await prisma.groupAttendance.create({
      data: {
        administratorName: parsedData.data.administratorName,
        date: parsedData.data.date,
        issues: parsedData.data.issues,
        totalIncome,
        totalContainersFilled,
        combination: {
          connect: {
            id: parsedData.data.combinationId
          }
        },
        group: {
          connect: {
            id: parsedData.data.groupId
          }
        },
        manager: parsedData.data.managerId ? {
          connect: {
            id: parsedData.data.managerId
          }
        } : undefined,
        workersAttendance: {
          create: workersWithWages.map(worker => ({
            worker: {
              connect: {
                id: worker.workerId
              }
            },
            containersFilled: worker.containersFilled,
            totalWage: worker.totalWage,
            hoursWorked: worker.hoursWorked,
            startTime: worker.startTime,
            endTime: worker.endTime,
          })),
        },
      },
      include: {
        workersAttendance: {
          include: {
            worker: true
          }
        },
        combination: true,
        group: true,
        manager: true,
      },
    });

    return {
      status: 201,
      message: "Attendance submitted successfully",
      data: attendance,
    };

  } catch (error) {
    console.error("Error submitting attendance:", error.stack);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
};

export default submitAttendance; 