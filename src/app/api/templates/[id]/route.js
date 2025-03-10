import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";
import { getDefaultSchema } from "@/lib/utils/pdfHelper";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: "Template ID is required" },
        { status: 400 }
      );
    }
    
    // Find template by ID
    const template = await prisma.workerDigitalFormTemplate.findUnique({
      where: { 
        id,
        isDeleted: false 
      },
      include: {
        templateAsset: true
      }
    });
    
    if (!template) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }
    
    // Get signed URL for template file if it exists
    let templateUrl = null;
    if (template.templateAsset && template.templateAsset.filePath) {
      templateUrl = await getSignedUrl(template.templateAsset.filePath);
    }
    
    // Parse schema if it exists, otherwise use default schema
    let schema = null;
    try {
      schema = template.schema ? JSON.parse(template.schema) : null;
    } catch (e) {
      console.error("Error parsing template schema:", e);
      schema = null;
    }
    
    // Create a properly formatted template object for pdfme
    const formattedTemplate = {
      basePdf: templateUrl,
      schemas: schema ? [schema] : getDefaultSchema().schemas,
      // Add additional metadata
      id: template.id,
      name: template.name,
      createdAt: template.createdAt
    };

    // console.log(formattedTemplate, "formattedTemplate");
    
    // Return template data with proper structure
    return NextResponse.json(formattedTemplate);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { message: "Failed to fetch template" },
      { status: 500 }
    );
  }
} 