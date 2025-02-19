"use server";
import prisma from "@/lib/prisma";

export const getBranches = async () => {
  try {
    const res = await prisma.branch.findMany({});
    return { data: res, status: 200 };
  } catch (error) {
    console.log(error);
    return { message: "Error fetching Branches Data", status: 500 };
  }
};
