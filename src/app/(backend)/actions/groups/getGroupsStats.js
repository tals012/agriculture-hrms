"use server";

import prisma from "@/lib/prisma";

const getGroupsStats = async () => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.setDate(now.getDate() - 7));

    const [totalGroupsCount, newGroupsCount] = await Promise.all([
      prisma.group.count(),
      prisma.group.count({
        where: {
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
    ]);

    return {
      status: 200,
      message: "נתוני הקבוצות נטענו בהצלחה",
      data: {
        totalGroupsCount,
        newGroupsCount,
      },
    };
  } catch (error) {
    console.error("Error fetching groups stats:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getGroupsStats;
