"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for validating filter parameters
const filterSchema = z.object({
  year: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  workerId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "ALL"]).optional(),
});

/**
 * Server action to fetch worker attendance records with filters
 * @param {Object} filters - Filter criteria
 * @returns {Object} Result object with attendance records
 */
export async function getAttendanceRequests(filters = {}) {
  try {
    // Parse and validate the filters
    const parsedFilters = filterSchema.safeParse(filters);
    
    if (!parsedFilters.success) {
      return {
        success: false,
        message: "שגיאת אימות פילטרים",
        errors: parsedFilters.error.format(),
      };
    }
    
    const { year, month, workerId, groupId, approvalStatus } = parsedFilters.data;
    
    // Build the where clause for the query
    const where = {};
    
    // Add date filters if year and month are provided
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      
      where.attendanceDate = {
        gte: startDate,
        lte: endDate,
      };
    }
    
    // Add worker filter if workerId is provided
    if (workerId) {
      where.workerId = workerId;
    }
    
    // Add group filter if groupId is provided
    if (groupId) {
      where.groupId = groupId;
    }
    
    // Add approval status filter if provided and not "ALL"
    if (approvalStatus && approvalStatus !== "ALL") {
      where.approvalStatus = approvalStatus;
    }
    
    // Execute the query
    const attendanceRecords = await prisma.workerAttendance.findMany({
      where,
      include: {
        worker: true,
        group: true,
        manager: true,
        combination: {
          include: {
            harvestType: true,
            species: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Return the records
    return {
      success: true,
      data: attendanceRecords,
    };
  } catch (error) {
    console.error("Error fetching attendance requests:", error.stack);
    return {
      success: false,
      message: "אירעה שגיאה בעת טעינת דיווחי הנוכחות",
      error: error.message,
    };
  }
} 