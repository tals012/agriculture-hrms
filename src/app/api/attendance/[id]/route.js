import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - retrieve single attendance record
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const attendance = await prisma.workerAttendance.findUnique({
      where: { id },
      include: {
        worker: true,
        group: true,
        manager: true,
        leader: {
          include: {
            worker: true,
          },
        },
        combination: {
          include: {
            harvestType: true,
            species: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "רשומת נוכחות לא נמצאה" },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { message: "שגיאה בהבאת רשומת הנוכחות" },
      { status: 500 }
    );
  }
}

// PATCH - update attendance record
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    // Validate the attendance exists
    const existingAttendance = await prisma.workerAttendance.findUnique({
      where: { id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { message: "רשומת נוכחות לא נמצאה" },
        { status: 404 }
      );
    }

    // Update the attendance record
    const updatedAttendance = await prisma.workerAttendance.update({
      where: { id },
      data: {
        // Allow updating only specific fields
        totalContainersFilled:
          data.totalContainersFilled !== undefined
            ? data.totalContainersFilled
            : undefined,

        // We could add more fields here that are allowed to be updated
        // Example:
        // totalHoursWorked: data.totalHoursWorked !== undefined
        //   ? data.totalHoursWorked
        //   : undefined,
      },
      include: {
        worker: true,
        group: true,
        manager: true,
        leader: {
          include: {
            worker: true,
          },
        },
        combination: {
          include: {
            harvestType: true,
            species: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { message: "שגיאה בעדכון רשומת הנוכחות" },
      { status: 500 }
    );
  }
}

// DELETE - delete attendance record
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Validate the attendance exists
    const existingAttendance = await prisma.workerAttendance.findUnique({
      where: { id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { message: "רשומת נוכחות לא נמצאה" },
        { status: 404 }
      );
    }

    // Delete the attendance record
    await prisma.workerAttendance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "רשומת הנוכחות נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { message: "שגיאה במחיקת רשומת הנוכחות" },
      { status: 500 }
    );
  }
}
