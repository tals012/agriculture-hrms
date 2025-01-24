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
        message: "User or worker not found",
        data: null,
      };
    }

    const leaderGroup = user.worker.groups.find(g => g.isGroupLeader);
    if (!leaderGroup) {
      return {
        status: 404,
        message: "No group found where user is leader",
        data: null,
      };
    }

    return {
      status: 200,
      message: "Group data retrieved successfully",
      data: leaderGroup.group,
    };

  } catch (error) {
    console.error("Error getting group data:", error);
    return {
      status: 500,
      message: "Internal server error",
      error: error.message,
      data: null,
    };
  }
}; 