"use server";
import prisma from "@/lib/prisma";

export const getBanks = async () => {
  try {
    const res = await prisma.bank.findMany({});
    return { data: res, status: 200 };
  } catch (error) {
    console.log(error);
    return { message: "Error fetching Banks Data", status: 500 };
  }
};
