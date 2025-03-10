import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [templates, categories] = await Promise.all([
      prisma.foreignWorkerDigitalFormTemplate.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          categoryId: true,
          simpleCategoryId: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.foreignWorkerDigitalFormCategory.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      templates,
      categories,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { message: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
