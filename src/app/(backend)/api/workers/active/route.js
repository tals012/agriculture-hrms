import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      where: {
        workerStatus: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        nameHe: true,
        passport: true,
      }
    });

    return NextResponse.json({
      status: 200,
      message: "Active workers fetched successfully",
      data: workers
    });
  } catch (error) {
    console.error("Error fetching active workers:", error);
    return NextResponse.json(
      { 
        status: 500,
        message: "Failed to fetch active workers",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 