"use server";

import prisma from "@/lib/prisma";

export async function getOrganizationSettings() {
  try {
    const settings = await prisma.organization.findFirst({
      select: {
        id: true,
        name: true,
        isBonusPaid: true
      }
    });

    if (!settings) {
      return {
        status: 404,
        message: "Organization settings not found"
      };
    }

    return {
      status: 200,
      message: "Organization settings fetched successfully",
      data: settings
    };
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return {
      status: 500,
      message: "Failed to fetch organization settings",
      error: error.message
    };
  }
} 