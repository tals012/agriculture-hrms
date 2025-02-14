"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const createPricingSchema = z.object({
  name: z.string().optional(),
  price: z.number().min(0, "המחיר חייב להיות מספר חיובי"),
  containerNorm: z.number().min(0, "נורמת המכלים חייבת להיות מספר חיובי").optional(),
  harvestTypeId: z.string().min(1, "סוג הקטיף נדרש"),
  speciesId: z.string().min(1, "זן נדרש"),
  clientId: z.string().min(1, "לקוח נדרש"),
});

const createPricing = async (input) => {
  try {
    const parsedData = createPricingSchema.safeParse(input);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הנתונים שסופקו אינם תקינים",
        errors: formattedErrors,
      };
    }

    const harvestType = await prisma.harvestType.findUnique({
      where: { id: parsedData.data.harvestTypeId }
    });

    if (!harvestType) {
      return {
        status: 404,
        message: "סוג הקטיף לא נמצא",
      };
    }

    const species = await prisma.species.findUnique({
      where: { id: parsedData.data.speciesId }
    });

    if (!species) {
      return {
        status: 404,
        message: "הזן לא נמצא",
      };
    }

    const client = await prisma.client.findUnique({
      where: { id: parsedData.data.clientId }
    });

    if (!client) {
      return {
        status: 404,
        message: "הלקוח לא נמצא",
      };
    }

    const existingCombination = await prisma.clientPricingCombination.findFirst({
      where: {
        harvestTypeId: parsedData.data.harvestTypeId,
        speciesId: parsedData.data.speciesId,
        clientId: parsedData.data.clientId,
      }
    });

    if (existingCombination) {
      return {
        status: 400,
        message: "קיים כבר תמחור עם פרמטרים אלו",
      };
    }

    const pricing = await prisma.clientPricingCombination.create({
      data: {
        name: parsedData.data.name,
        price: parsedData.data.price,
        containerNorm: parsedData.data.containerNorm,
        harvestTypeId: parsedData.data.harvestTypeId,
        speciesId: parsedData.data.speciesId,
        clientId: parsedData.data.clientId,
      },
      include: {
        harvestType: {
          select: {
            id: true,
            name: true,
          }
        },
        species: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    });

    return {
      status: 201,
      message: "התמחור נוצר בהצלחה",
      data: pricing
    };

  } catch (error) {
    console.error("Error creating pricing combination:", error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      error: error.message
    };
  }
};

export default createPricing;
