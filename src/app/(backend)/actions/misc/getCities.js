"use server";

import prisma from "@/lib/prisma";

const getCities = async () => {
  try {
    const cities = await prisma.city.findMany();

    return {
      status: 200,
      message: "הערים נטענו בהצלחה",
      data: cities,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "שגיאת שרת פנימית",
      data: null,
    };
  }
};

export default getCities;
