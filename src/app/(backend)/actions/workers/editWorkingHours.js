"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const editWorkingHoursSchema = z.object({
  id: z.string().min(1, "נדרש מזהה נוכחות עובד"),
  field: z.enum(['startTime', 'endTime', 'hoursWorked', 'totalWage', 'containersFilled']),
  value: z.union([z.string(), z.number(), z.date()]),
});

const editWorkingHours = async (input) => {
  try {
    const parsedData = editWorkingHoursSchema.safeParse(input);

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

    // Get the current record to validate the update
    const currentRecord = await prisma.workerAttendance.findUnique({
      where: { id: parsedData.data.id },
      include: {
        attendance: {
          include: {
            combination: true,
          },
        },
      },
    });

    if (!currentRecord) {
      return {
        status: 404,
        message: "רשומת נוכחות העובד לא נמצאה",
      };
    }

    // Prepare update data
    const updateData = {};

    switch (parsedData.data.field) {
      case 'startTime':
      case 'endTime':
        updateData[parsedData.data.field] = new Date(parsedData.data.value);
        // Recalculate hours worked if time changes
        if (parsedData.data.field === 'startTime' && currentRecord.endTime) {
          const endTime = currentRecord.endTime;
          const startTime = new Date(parsedData.data.value);
          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          updateData.hoursWorked = Math.max(0, hours);
        } else if (parsedData.data.field === 'endTime' && currentRecord.startTime) {
          const startTime = currentRecord.startTime;
          const endTime = new Date(parsedData.data.value);
          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          updateData.hoursWorked = Math.max(0, hours);
        }
        break;

      case 'hoursWorked':
        updateData.hoursWorked = parseFloat(parsedData.data.value);
        break;

      case 'totalWage':
        updateData.totalWage = parseFloat(parsedData.data.value);
        break;

      case 'containersFilled':
        updateData.containersFilled = parseInt(parsedData.data.value);
        // Recalculate wage if containers change and we have pricing info
        if (currentRecord.attendance.combination?.price) {
          const containerNorm = currentRecord.attendance.combination.containerNorm || 1;
          const performanceRatio = parseInt(parsedData.data.value) / containerNorm;
          updateData.totalWage = currentRecord.attendance.combination.price * performanceRatio;
        }
        break;
    }

    // Update the record
    const updatedRecord = await prisma.workerAttendance.update({
      where: { id: parsedData.data.id },
      data: updateData,
      include: {
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
    });

    return {
      status: 200,
      message: "שעות העבודה עודכנו בהצלחה",
      data: updatedRecord,
    };

  } catch (error) {
    console.error("Error updating working hours:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
    };
  }
};

export default editWorkingHours;
