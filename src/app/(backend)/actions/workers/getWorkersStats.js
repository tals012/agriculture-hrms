"use server";

import prisma from "@/lib/prisma";

const getWorkersStats = async (clientId) => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.setDate(now.getDate() - 7));

    const baseWhere = clientId ? { clientId } : {};

    const [
      totalWorkersCount,
      newWorkersCount,
      activeWorkersCount,
      inactiveWorkersCount,
      freezeWorkersCount,
      committeeWorkersCount,
      hiddenWorkersCount,
      inTransitWorkersCount,
    ] = await Promise.all([
      prisma.worker.count({
        where: baseWhere,
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          workerStatus: "ACTIVE",
        },
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          workerStatus: "INACTIVE",
        },
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          workerStatus: "FREEZE",
        },
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          workerStatus: "COMMITTEE",
        },
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          workerStatus: "HIDDEN",
        },
      }),
      prisma.worker.count({
        where: {
          ...baseWhere,
          workerStatus: "IN_TRANSIT",
        },
      }),
    ]);

    return {
      status: 200,
      message: "סטטיסטיקות העובדים נטענו בהצלחה",
      data: {
        totalWorkersCount,
        newWorkersCount,
        activeWorkersCount,
        inactiveWorkersCount,
        freezeWorkersCount,
        committeeWorkersCount,
        hiddenWorkersCount,
        inTransitWorkersCount,
      },
    };
  } catch (error) {
    console.error("Error fetching workers stats:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  }
};

export default getWorkersStats; 