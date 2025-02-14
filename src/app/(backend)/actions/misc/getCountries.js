"use server";

import prisma from "@/lib/prisma";

const getCountries = async () => {
  try {
    const countries = await prisma.country.findMany();

    return {
      status: 200,
      message: "המדינות נטענו בהצלחה",
      data: countries,
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

export default getCountries;
