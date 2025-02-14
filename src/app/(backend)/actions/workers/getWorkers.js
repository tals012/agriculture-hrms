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
          { surname: { contains: filters.search, mode: "insensitive" } },
          { primaryPhone: { contains: filters.search, mode: "insensitive" } },
          { secondaryPhone: { contains: filters.search, mode: "insensitive" } },
          { passport: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }

    if (filters.clientId) {
      where.AND.push({ currentClientId: filters.clientId });
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

    const workers = await prisma.worker.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        name: true,
        surname: true,
        fatherName: true,
        motherName: true,
        nameSpouse: true,
        nameHe: true,
        surnameHe: true,
        primaryPhone: true,
        secondaryPhone: true,
        email: true,
        address: true,
        sex: true,
        birthday: true,
        maritalStatus: true,
        primaryLanguage: true,
        primaryLanguages: true,
        secondaryLanguage: true,
        secondaryLanguages: true,
        additionalLanguages: true,
        countryArea: true,
        religion: true,
        workerStatus: true,
        company: true,
        metapelCode: true,
        passport: true,
        passportValidity: true,
        visa: true,
        visaValidity: true,
        inscriptionDate: true,
        entryDate: true,
        favoritePlace: true,
        favoriteSex: true,
        partnerPlace: true,
        note: true,
        currentClientId: true,
        country: {
          select: {
            id: true,
            nameInHebrew: true,
            nameInEnglish: true,
          },
        },
        city: {
          select: {
            id: true,
            nameInHebrew: true,
            nameInEnglish: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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
