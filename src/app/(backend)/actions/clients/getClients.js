"use server";

import prisma from "@/lib/prisma";

const getClients = async (filters = {}) => {
  console.log("Filters received:", filters);

  try {
    const where = { AND: [] };

    // Search filter
    if (filters?.search?.trim()) {
      where.AND.push({
        OR: [
          { serialNumber: { contains: filters.search, mode: "insensitive" } },
          { name: { contains: filters.search, mode: "insensitive" } },
          { nameEnglish: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }

    // Name filter
    if (filters?.name?.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: filters.name, mode: "insensitive" } },
          { nameEnglish: { contains: filters.name, mode: "insensitive" } },
        ],
      });
    }

    // Phone filter
    if (filters?.phone?.trim()) {
      where.AND.push({
        OR: [
          { phone: { contains: filters.phone, mode: "insensitive" } },
          { secondaryPhone: { contains: filters.phone, mode: "insensitive" } },
        ],
      });
    }

    // Status filter
    if (filters?.status) {
      where.AND.push({ status: filters.status });
    }

    const clients = await prisma.client.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        serialNumber: true,
        name: true,
        nameEnglish: true,
        email: true,
        phone: true,
        secondaryPhone: true,
        logo: true,
        openingDate: true,
        address: true,
        postalCode: true,
        licenseNumber: true,
        businessGovId: true,
        fax: true,
        accountantPhone: true,
        status: true,
        note: true,
        createdAt: true,
        city: {
          select: {
            id: true,
            nameInHebrew: true,
          },
        },
      },
      orderBy: {
        serialNumber: "asc",
      },
    });

    return {
      status: 200,
      message: "Clients fetched successfully",
      data: clients,
    };
  } catch (error) {
    console.error("Error fetching clients:", error.stack);
    return {
      status: 500,
      message: "Internal server error",
      data: [],
    };
  }
};

export default getClients;
