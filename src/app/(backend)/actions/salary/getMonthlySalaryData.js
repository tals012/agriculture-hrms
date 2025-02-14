"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const getMonthlySalaryDataSchema = z.object({
  monthYear: z.string().optional(),
});


const getMonthlySalaryData = async (filters = {}) => {
  try {
    const parsedFilters = getMonthlySalaryDataSchema.safeParse(filters);

    

    if (!parsedFilters.success) {
      const formattedErrors = parsedFilters.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return {
        status: 400,
        message: "הפילטרים שסופקו אינם תקינים",
        errors: formattedErrors,
        data: []
      };
    }

    const where = { 
        monthYear: parsedFilters.data.monthYear,
     };


  } catch (error) {
  }
}; 

export default getMonthlySalaryData;