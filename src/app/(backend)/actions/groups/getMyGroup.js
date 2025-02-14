"use server";

import prisma from "@/lib/prisma";

export const getMyGroup = async ({ userId }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        worker: {
          include: {
            groups: {
              where: { isGroupLeader: true },
              include: {
                group: {
                  include: {
                    field: {
                      include: {
                        client: true
                      }
                    },
                    members: {
                      include: {
                        worker: {
                          include: {
                            user: true
                          }
                        }
                      }
                    },
                    clientPricingCombination: {
                      include: {
                        species: true,
                        harvestType: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.worker) {
      return {
        status: 404,
        message: "משתמש או עובד לא נמצאו",
        data: null,
      };
    }

    const leaderGroup = user.worker.groups.find(g => g.isGroupLeader);
    if (!leaderGroup) {
      return {
        status: 404,
        message: "לא נמצאה קבוצה שבה המשתמש הוא מנהל",
        data: null,
      };
    }

    return {
      status: 200,
      message: "נתוני הקבוצה אוחזרו בהצלחה",
      data: leaderGroup.group,
    };

  } catch (error) {
    console.error("שגיאה באחזור נתוני הקבוצה:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message,
      data: null,
    };
  }
}; 