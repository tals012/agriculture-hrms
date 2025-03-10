"use server";

import prisma from "@/lib/prisma";

export async function getWorkersDetails(workerIds) {
  const workersDetails = await prisma.foreignWorker.findMany({
    where: {
      id: {
        in: workerIds,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      israelPhoneNumber: true,
      serialNumber: true,
    },
  });

  return workersDetails;
}
