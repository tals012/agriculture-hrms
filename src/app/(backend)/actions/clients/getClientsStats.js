"use server";

import prisma from "@/lib/prisma";

const getClientsStats = async () => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.setDate(now.getDate() - 7));

    const [
      totalClientsCount,
      newClientsCount,
      activeClientsCount,
      inactiveClientsCount,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({
        where: {
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
      prisma.client.count({
        where: {
          status: "ACTIVE",
        },
      }),
      prisma.client.count({
        where: {
          status: "INACTIVE",
        },
      }),
    ]);

    return {
      status: 200,
        message: "נתוני לקוחות נשלפו בהצלחה",
      data: {
        totalClientsCount,
        newClientsCount,
        activeClientsCount,
        inactiveClientsCount,
      },
    };
  } catch (error) {
    console.error("Error fetching clients stats:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getClientsStats;
