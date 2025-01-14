"use server";

import prisma from "@/lib/prisma";

const getClients = async ({ payload }) => {
  try {
    const { name, status, phone, search } = payload;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { secondaryPhone: { contains: search, mode: "insensitive" } },
                { serialNumber: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        name
          ? {
              OR: [
                { name: { contains: name, mode: "insensitive" } },
                { nameEnglish: { contains: name, mode: "insensitive" } },
              ],
            }
          : {},
        phone
          ? {
              OR: [
                { phone: { contains: phone, mode: "insensitive" } },
                { secondaryPhone: { contains: phone, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status: { equals: status } } : {},
      ],
    };

    const clients = await prisma.client.findMany({
      where,
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
        city: true,
        postalCode: true,
        licenseNumber: true,
        licenseExpiry: true,
        businessGovId: true,
        fax: true,
        accountantPhone: true,
        status: true,
        note: true,
        createdAt: true,
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
    console.error("Error fetching clients:", error);
    return {
      status: 500,
      message: "Internal server error",
      data: null,
    };
  }
};

export default getClients;
