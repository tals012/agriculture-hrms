"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schema for validating the approval status update
const updateApprovalStatusSchema = z.object({
  attendanceId: z.string({
    required_error: "מזהה דיווח הנוכחות נדרש",
  }),
  approvalStatus: z.enum(["APPROVED", "REJECTED"], {
    required_error: "נדרש סטטוס אישור תקין (APPROVED או REJECTED)",
  }),
  rejectionReason: z.string().optional(),
});

/**
 * Server action to update the approval status of a worker attendance record
 * @param {Object} formData - Form data containing attendanceId and approvalStatus
 * @returns {Object} Result object with success status and message
 */
export async function updateApprovalStatus(formData) {
  try {
    // Parse and validate the input data
    const parsedData = updateApprovalStatusSchema.safeParse({
      attendanceId: formData.get("attendanceId"),
      approvalStatus: formData.get("approvalStatus"),
      rejectionReason: formData.get("rejectionReason") || null,
    });

    if (!parsedData.success) {
      const error = parsedData.error.format();
      return {
        success: false,
        message: "שגיאת אימות נתונים",
        errors: error,
      };
    }

    const { attendanceId, approvalStatus, rejectionReason } = parsedData.data;

    // Check if the attendance record exists
    const existingAttendance = await prisma.workerAttendance.findUnique({
      where: {
        id: attendanceId,
      },
    });

    if (!existingAttendance) {
      return {
        success: false,
        message: "דיווח הנוכחות לא נמצא",
      };
    }

    // Update the approval status
    const updatedAttendance = await prisma.workerAttendance.update({
      where: {
        id: attendanceId,
      },
      data: {
        approvalStatus,
        approvalDate: new Date(),
        rejectionReason: approvalStatus === "REJECTED" ? rejectionReason : null,
      },
    });

    // Revalidate the attendance requests page
    revalidatePath("/admin/attendance-requests");

    return {
      success: true,
      message:
        approvalStatus === "APPROVED"
          ? "דיווח הנוכחות אושר בהצלחה"
          : "דיווח הנוכחות נדחה בהצלחה",
      data: updatedAttendance,
    };
  } catch (error) {
    console.error("Error updating approval status:", error.stack);
    return {
      success: false,
      message: "אירעה שגיאה בעת עדכון סטטוס האישור",
      error: error.message,
    };
  }
} 