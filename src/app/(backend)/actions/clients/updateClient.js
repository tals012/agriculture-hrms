"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const updateClientSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  nameEnglish: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  logo: z.string().optional(),
  openingDate: z.date().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExist: z.boolean().optional(),
  licenseFromDate: z.date().optional(),
  licenseToDate: z.date().optional(),
  businessGovId: z.string().optional(),
  fax: z.string().optional(),
  accountantPhone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  note: z.string().optional(),
  cityId: z.string().optional(),
  note: z.string().optional(),
});

const updateClient = async ({ payload }) => {
  try {
    const parsedData = updateClientSchema.safeParse(payload);
    if (!parsedData.success) {
      return {
        status: 400,
        message: parsedData.error.errors.map((e) => e.message).join(", "),
        data: null,
      };
    }

    const { id, ...updateData } = parsedData.data;

    const clientExists = await prisma.client.findUnique({
      where: { id },
    });

    if (!clientExists) {
      return {
        status: 404,
        message: "Client not found",
        data: null,
      };
    }

    const updateDataNotNull = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== null)
    );

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateDataNotNull,
    });

    return {
      status: 200,
      message: "Client updated successfully",
      data: updatedClient,
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      status: 500,
      message: "Internal server error",
      data: null,
    };
  }
};

export default updateClient;
