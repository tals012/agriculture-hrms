"use server";

import prisma from "@/lib/prisma";

/**
 * Server action to fetch group options for dropdown selection
 * @returns {Object} Result object with group options
 */
export async function getGroupOptions() {
  try {
    // Fetch groups from the database
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Format the groups as options for a select dropdown
    const groupOptions = groups.map((group) => ({
      value: group.id,
      label: group.name || group.id,
    }));

    return {
      success: true,
      data: groupOptions,
    };
  } catch (error) {
    return {
      success: false,
      message: "אירעה שגיאה בטעינת רשימת הקבוצות",
      error: error.message,
    };
  }
}
