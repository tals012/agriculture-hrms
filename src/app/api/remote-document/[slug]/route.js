import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";
const link = await getSignedUrl(documentAsset.filePath);

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { message: "Document slug is required" },
        { status: 400 }
      );
    }
    
    // Find document by slug
    const document = await prisma.workerDocument.findFirst({
      where: { 
        slug,
        isDeleted: false
      },
      include: {
        asset: true
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { message: "Document not found or has expired" },
        { status: 404 }
      );
    }
    
    // Mark document as viewed if not already viewed
    if (document.status === "PENDING") {
      await prisma.workerDocument.update({
        where: { id: document.id },
        data: { status: "VIEWED" }
      });
    }
    
    // Generate signed URL for document access
    let documentUrl = null;
    if (document.asset) {
      documentUrl = await getSignedUrl(document.asset.filePath);
    }
    
    // Return document data with signed URL
    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
        url: documentUrl,
        status: document.status,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error("Error fetching remote document:", error);
    return NextResponse.json(
      { message: "Failed to fetch document" },
      { status: 500 }
    );
  }
} 