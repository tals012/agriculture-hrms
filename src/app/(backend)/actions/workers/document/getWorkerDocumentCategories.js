"use server";

import prisma from "@/lib/prisma";

/**
 * Get document categories for worker documents
 * 
 * @returns {Promise<{ok: boolean, data?: Array, message?: string}>} Result with document categories
 */
export async function getWorkerDocumentCategories() {
  try {
    const categories = await prisma.workerSimpleCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return {
      ok: true,
      data: categories
    };
  } catch (error) {
    console.error("Error fetching document categories:", error);
    return { ok: false, message: error.message };
  }
} 