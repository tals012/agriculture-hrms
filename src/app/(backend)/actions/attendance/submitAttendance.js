"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const submitAttendanceSchema = z.object({
  administratorName: z.string().min(1, "נדרש שם מנהל"),
  date: z.date(),
  combinationId: z.string().min(1, "נדרש מזהה תמחור"),
  issues: z.array(z.string()),
  groupId: z.string().min(1, "נדרש מזהה קבוצה"),
  managerId: z.string().optional(),
  workersAttendance: z.array(z.object({
    workerId: z.string().min(1, "נדרש מזהה עובד"),
    containersFilled: z.number().min(0, "מספר המכלים חייב להיות מספר חיובי"),
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
        message: "הנתונים שסופקו אינם תקינים",
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
        message: "הקבוצה או השדה המשויך לא נמצאו",
      };
    }

    // Get the pricing combination to calculate wages
    const pricingCombination = await prisma.clientPricingCombination.findUnique({
      where: { id: parsedData.data.combinationId },
    });

    if (!pricingCombination) {
      return {
        status: 404,
        message: "תמחור לא נמצא",
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
        message: "חלק מהעובדים אינם קיימים",
        errors: invalidWorkerIds.map(id => ({
          field: 'workerId',
          message: `עובד עם מזהה ${id} לא נמצא`
        }))
      };
    }

    // Calculate total work hours for the field
    const totalWorkHours = (group.field.fieldCloseTime - group.field.fieldOpenTime) / 60;

    // Create attendance records for each worker
    const attendanceRecords = await Promise.all(
      parsedData.data.workersAttendance.map(async (workerData) => {
        const status = workerData.containersFilled > 0 ? 'WORKING' : 'ABSENT';
        
        return prisma.workerAttendance.create({
          data: {
            workerId: workerData.workerId,
            status,
            attendanceAdministratorName: parsedData.data.administratorName,
            attendanceDate: parsedData.data.date,
            combinationId: parsedData.data.combinationId,
            issues: parsedData.data.issues,
            totalContainersFilled: workerData.containersFilled,
            totalWage: workerData.containersFilled * pricingCombination.price,
            groupId: parsedData.data.groupId,
            managerId: parsedData.data.managerId,
            startTimeInMinutes: group.field.fieldOpenTime,
            endTimeInMinutes: group.field.fieldCloseTime,
            totalHoursWorked: totalWorkHours,
          },
          include: {
            worker: true,
            combination: true,
            group: true,
            manager: true,
          },
        });
      })
    );

    return {
      status: 201,
      message: "הנוכחות נשמרה בהצלחה",
      data: attendanceRecords,
    };

  } catch (error) {
    console.error('Error in submitAttendance:', error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
};

export default submitAttendance; 