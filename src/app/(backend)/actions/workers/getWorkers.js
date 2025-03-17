"use server";

import prisma from "@/lib/prisma";

const getWorkers = async (filters = {}) => {
  console.log("Filters received:", filters);
  try {
    const where = { AND: [] };

    // Search filter
    if (filters?.search?.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { nameHe: { contains: filters.search, mode: "insensitive" } },
          { surname: { contains: filters.search, mode: "insensitive" } },
          { surnameHe: { contains: filters.search, mode: "insensitive" } },
          { primaryPhone: { contains: filters.search, mode: "insensitive" } },
          { secondaryPhone: { contains: filters.search, mode: "insensitive" } },
          { passport: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }

    if (filters.clientId) {
      where.AND.push({ currentClientId: filters.clientId });
    }

    if (filters.fieldId) {
      where.AND.push({
        groups: {
          some: {
            group: {
              fieldId: filters.fieldId,
            },
            endDate: null,
          },
        },
      });
    }

    if (filters.groupId) {
      where.AND.push({
        groups: {
          some: {
            groupId: filters.groupId,
            endDate: null,
          },
        },
      });
    }

    // Add country filter
    if (filters.countryId) {
      where.AND.push({ countryId: filters.countryId });
    }

    if (filters.name?.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: filters.name, mode: "insensitive" } },
          { surname: { contains: filters.name, mode: "insensitive" } },
        ],
      });
    }
    if (filters.phone?.trim()) {
      where.AND.push({
        OR: [
          { primaryPhone: { contains: filters.phone, mode: "insensitive" } },
        ],
      });
    }
    if (filters.status) {
      where.AND.push({ workerStatus: filters.status });
    }

    if (filters.passport?.trim()) {
      where.AND.push({
        passport: { contains: filters.passport, mode: "insensitive" },
      });
    }

    const workers = await prisma.worker.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        nameHe: true,
        surnameHe: true,
        passport: true,
        workerStatus: true,
        primaryPhone: true,
        country: {
          select: {
            nameInHebrew: true,
          },
        },
        groups: {
          select: {
            group: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ nameHe: "asc" }, { surnameHe: "asc" }],
    });

    // console.log("Workers found:", workers);

    return {
      status: 200,
      message: "העובדים נטענו בהצלחה",
      data: workers,
    };
  } catch (error) {
    console.error("Error fetching workers:", error.stack);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: [],
    };
  }
};

export default getWorkers;
