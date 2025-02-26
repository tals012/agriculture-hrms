"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for validating filter parameters
const filterSchema = z.object({
  year: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  workerId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  approvalStatus: z.enum(["APPROVED", "REJECTED", "ALL"]).optional(),
});

/**
 * Server action to fetch worker attendance records grouped by date
 * This only returns approved or rejected records (not pending)
 * @param {Object} filters - Filter criteria
 * @returns {Object} Result object with grouped attendance records
 */
export async function getGroupedAttendanceRecords(filters = {}) {
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
    // Start with base filter for only approved or rejected records
    const where = {
      approvalStatus: {
        in: ["APPROVED", "REJECTED"]
      }
    };
    
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
    
    // Add specific approval status filter if provided and not "ALL"
    if (approvalStatus && approvalStatus !== "ALL") {
      where.approvalStatus = approvalStatus;
    }
    
    // Execute the query to get all matching records
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
      orderBy: [
        { attendanceDate: "asc" },
        { createdAt: "desc" },
      ],
    });
    
    // Group the records by date
    const groupedRecords = [];
    const recordsByDate = {};
    
    // Process each record and organize by date
    attendanceRecords.forEach(record => {
      // Format the date as YYYY-MM-DD for grouping
      const dateKey = record.attendanceDate.toISOString().split('T')[0];
      
      // If this is the first record for this date, create a new group
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = {
          date: record.attendanceDate,
          formattedDate: dateKey,
          records: [],
          // Summary statistics
          totalRecords: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalContainers: 0,
          groups: new Set(),
          workers: new Set()
        };
      }
      
      // Add the record to its date group
      recordsByDate[dateKey].records.push(record);
      
      // Update the summary statistics
      recordsByDate[dateKey].totalRecords++;
      
      if (record.approvalStatus === "APPROVED") {
        recordsByDate[dateKey].approvedCount++;
      } else if (record.approvalStatus === "REJECTED") {
        recordsByDate[dateKey].rejectedCount++;
      }
      
      if (record.totalContainersFilled) {
        recordsByDate[dateKey].totalContainers += record.totalContainersFilled;
      }
      
      if (record.groupId) {
        recordsByDate[dateKey].groups.add(record.groupId);
      }
      
      if (record.workerId) {
        recordsByDate[dateKey].workers.add(record.workerId);
      }
    });
    
    // Convert the record map to an array and finalize the statistics
    for (const dateKey in recordsByDate) {
      const dateGroup = recordsByDate[dateKey];
      
      // Convert Sets to counts for the response
      dateGroup.uniqueGroupsCount = dateGroup.groups.size;
      dateGroup.uniqueWorkersCount = dateGroup.workers.size;
      
      // Remove the Sets before returning (they don't serialize well)
      delete dateGroup.groups;
      delete dateGroup.workers;
      
      groupedRecords.push(dateGroup);
    }
    
    // Sort the groups by date (newest first)
    groupedRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Return the grouped records
    return {
      success: true,
      data: groupedRecords,
    };
  } catch (error) {
    console.error("Error fetching grouped attendance records:", error.stack);
    return {
      success: false,
      message: "אירעה שגיאה בעת טעינת דיווחי הנוכחות המקובצים",
      error: error.message,
    };
  }
}

export default getGroupedAttendanceRecords; 