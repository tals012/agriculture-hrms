/**
 * API Route: Register Worker in External Salary System
 * 
 * This endpoint registers or updates a worker's information in the external salary system.
 * It should be called before sending any salary data for a worker.
 * 
 * Endpoint: POST /api/salary/register-worker
 * Body: { workerId: string }
 */

import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { NextResponse } from "next/server";
import axios from "axios";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { 
  extractNumberFromPassport,
  formatWorkerDataForSalarySystem,
  createHttpsAgent
} from "@/lib/utils/salarySystem";

// Configure dayjs to handle timezones
dayjs.extend(utc);
dayjs.extend(timezone);

// Set maximum duration for the API route (5 minutes)
export const maxDuration = 300;

export async function POST(req) {
  try {
    // Extract workerId from request body
    const body = await req.json();
    const { workerId } = body;

    // Fetch worker with all necessary relations for salary system
    const worker = await prisma.worker.findUnique({
      where: {
        id: workerId,
      },
      include: {
        country: true,
        city: true,
        user: true,
        currentClient: true,
        bank: true,
        branch: true,
      },
    });

    // Return 404 if worker not found
    if (!worker) {
      return NextResponse.json(
        { message: "Worker not found!" },
        { status: 404 }
      );
    }

    // Validate required fields
    const missingFields = [];
    
    // Check passport
    if (!worker.passport) {
      missingFields.push("Passport number");
    }

    // Check first name (either English or Hebrew)
    if (!worker.name && !worker.nameHe) {
      missingFields.push("First name (English or Hebrew)");
    }

    // Check last name (either English or Hebrew)
    if (!worker.surname && !worker.surnameHe) {
      missingFields.push("Last name (English or Hebrew)");
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: `Missing required fields: ${missingFields.join(", ")}` 
        },
        { status: 400 }
      );
    }

    // Validate passport number
    const passportNumberOnly = extractNumberFromPassport(worker.passport);
    if (!passportNumberOnly) {
      return NextResponse.json(
        { message: "Invalid passport number!" },
        { status: 400 }
      );
    }

    // Format worker data for salary system
    const workerData = formatWorkerDataForSalarySystem(worker);

    // Send data to external salary system
    const response = await axios.post(
      `https://salary.wavesmartflow.co.il/php/api.php?user=${process.env.SALARY_SYSTEM_USER_ID}&pass=${process.env.SALARY_SYSTEM_API_PASSWORD}`,
      workerData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent: createHttpsAgent(),
      }
    );

    // Return response based on salary system's response
    if (response.data) {
      return NextResponse.json({ 
        status: 200,
        message: "Worker registered successfully",
        data: response.data 
      });
    }

    return NextResponse.json({ 
      status: 201,
      message: "Worker registration initiated",
      data: {} 
    });
  } catch (error) {
    // Log error and return 500 response
    console.error("Error registering worker in salary system:", error);
    return NextResponse.json(
      { 
        status: 500,
        message: "Failed to register worker in salary system",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 