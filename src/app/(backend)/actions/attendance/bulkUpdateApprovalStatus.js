"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schema for validating input
const bulkUpdateSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  approvalStatus: z.enum(["APPROVED", "REJECTED"], {
    invalid_type_error: "Status must be either APPROVED or REJECTED",
  }),
  rejectionReason: z.string().optional().nullable(),
});

/**
 * Bulk update approval status for attendance requests by group
 * @param {FormData} formData - Form data containing groupId, approvalStatus and optional rejectionReason
 * @returns {Object} Object containing success status, message, and count of updated records
 */
export async function bulkUpdateApprovalStatus(formData) {
  try {
    // Extract and validate input data
    const rawData = {
      groupId: formData.get("groupId"),
      approvalStatus: formData.get("approvalStatus"),
      rejectionReason: formData.get("rejectionReason") || null,
    };

    // Validate input
    const validationResult = bulkUpdateSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      return { success: false, message: `Invalid input: ${errorMessage}` };
    }

    const { groupId, approvalStatus, rejectionReason } = validationResult.data;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { success: false, message: "הקבוצה שנבחרה אינה קיימת" };
    }

    // For REJECTED status, ensure rejection reason is provided
    if (approvalStatus === "REJECTED" && !rejectionReason) {
      return { 
        success: false, 
        message: "יש לספק סיבה לדחיית הבקשות"
      };
    }

    // Update all pending attendance records for this group
    const updatedAttendances = await prisma.workerAttendance.updateMany({
      where: {
        groupId: groupId,
        approvalStatus: "PENDING",
      },
      data: {
        approvalStatus,
        approvalDate: new Date(),
        rejectionReason: approvalStatus === "REJECTED" ? rejectionReason : null,
      },
    });

    // Revalidate the attendance requests page
    revalidatePath("/admin/attendance-requests");

    // Return success result with count of updated records
    if (updatedAttendances.count === 0) {
      return {
        success: true,
        message: "אין בקשות ממתינות לקבוצה זו",
        count: 0,
      };
    }

    const statusText = approvalStatus === "APPROVED" ? "אושרו" : "נדחו";
    return {
      success: true,
      message: `${updatedAttendances.count} בקשות ${statusText} בהצלחה`,
      count: updatedAttendances.count,
    };
  } catch (error) {
    // Handle unexpected errors
    return {
      success: false,
      message: `אירעה שגיאה בעדכון הבקשות: ${error.message}`,
      error: error.toString(),
    };
  }
} 