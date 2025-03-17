import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(request, { params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { message: "Document slug is required" },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { signatureData } = body;
    
    if (!signatureData) {
      return NextResponse.json(
        { message: "Signature data is required" },
        { status: 400 }
      );
    }
    
    // Find document by slug
    const document = await prisma.workerDocument.findFirst({
      where: { 
        slug,
        isDeleted: false
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { message: "Document not found or has expired" },
        { status: 404 }
      );
    }
    
    // Check if document is already signed
    if (document.status === "SIGNED") {
      return NextResponse.json(
        { message: "Document has already been signed" },
        { status: 400 }
      );
    }
    
    // Update document status to SIGNED and save signature data
    await prisma.workerDocument.update({
      where: { id: document.id },
      data: {
        status: "SIGNED",
        signatureData,
        signedAt: new Date()
      }
    });
    
    // Revalidate worker documents cache
    revalidateTag("worker-documents");
    
    return NextResponse.json({
      message: "Document signed successfully",
      documentId: document.id
    });
  } catch (error) {
    console.error("Error submitting signed document:", error);
    return NextResponse.json(
      { message: "Failed to submit document" },
      { status: 500 }
    );
  }
} 