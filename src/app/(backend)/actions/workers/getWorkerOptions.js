"use server";

import prisma from "@/lib/prisma";

/**
 * Server action to fetch worker options for dropdown selection
 * @returns {Object} Result object with worker options
 */
export async function getWorkerOptions() {
  try {
    // Fetch workers from the database - include both active and inactive workers
    const workers = await prisma.worker.findMany({
      // Show all workers, not just active ones
      // where: {
      //   isActive: true
      // },
      select: {
        id: true,
        nameHe: true,
        surnameHe: true,
        workerStatus: true
      },
      orderBy: {
        nameHe: 'asc'
      }
    });
    
    console.log(`Found ${workers.length} workers`);
    
    // Format the workers as options for a select dropdown
    const workerOptions = workers.map(worker => ({
      value: worker.id,
      label: `${worker.nameHe || ""} ${worker.surnameHe || ""}`.trim() || worker.id
    }));
    
    console.log("Worker options formatted:", workerOptions);
    
    return {
      success: true,
      data: workerOptions
    };
  } catch (error) {
    console.error("Error fetching worker options:", error);
    return {
      success: false,
      message: "אירעה שגיאה בטעינת רשימת העובדים",
      error: error.message
    };
  }
} 