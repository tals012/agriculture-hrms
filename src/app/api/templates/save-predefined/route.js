import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const templateJson = await request.json();
    const { name } = templateJson;

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Create data/templates directory if it doesn't exist
    const templatesDir = path.join(process.cwd(), "data", "templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Create a safe filename from the Hebrew name
    const safeHebrewName = name
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove invalid filename characters
      .trim();

    const filename = `${safeHebrewName}.json`;
    const localFilePath = path.join(templatesDir, filename);

    // Save the template JSON to local file
    fs.writeFileSync(localFilePath, JSON.stringify(templateJson, null, 2));

    // Get or create the "טפסים מובנים" category
    console.log("Looking for category: טפסים מובנים");
    let category = await prisma.documentCategoryWorker.findFirst({
      where: {
        name: "טפסים מובנים",
      },
    });

    console.log("Existing category:", category);

    if (!category) {
      console.log("Creating new category");
      try {
        category = await prisma.documentCategoryWorker.create({
          data: {
            name: "טפסים מובנים",
          },
        });
        console.log("Created category:", category);
      } catch (error) {
        console.error("Error creating category:", error);
        throw error;
      }
    }

    if (!category?.id) {
      throw new Error("Failed to get or create category");
    }

    // Get organization system info for the S3 path
    const orgSys = await prisma.organizationSystem.findFirst({
      select: {
        internalOrganizationId: true,
        internalProjectId: true,
      },
    });

    if (!orgSys) {
      throw new Error("Organization System not found");
    }

    // Create S3 path
    const s3FilePath = `organizations/org-${orgSys.internalOrganizationId}/projects/proj-${orgSys.internalProjectId}/data/template-files/${filename}`;

    // Upload to S3
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3FilePath,
          Body: JSON.stringify(templateJson),
          ContentType: "application/json",
        })
      );
      console.log("Uploaded to S3:", s3FilePath);
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }

    // Create asset for the template
    const asset = await prisma.asset.create({
      data: {
        filePath: s3FilePath,
        type: "DIGITAL_FORM_PDF_TEMPLATE_JSON",
        status: "READY",
      },
    });

    console.log("Creating template with category ID:", category.id);

    // First create the template
    const template = await prisma.foreignWorkerDigitalFormTemplate.create({
      data: {
        name,
        description: `Template imported: ${name}`,
        templateAssetId: asset.id,
      },
    });

    // Then update it to set the category
    const updatedTemplate =
      await prisma.foreignWorkerDigitalFormTemplate.update({
        where: { id: template.id },
        data: {
          documentCategoryId: category.id,
        },
        include: {
          documentCategory: true,
        },
      });

    console.log("Created and updated template:", updatedTemplate);

    return NextResponse.json({
      success: true,
      filename,
      categoryId: category.id,
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Error saving predefined template:", error);
    return NextResponse.json(
      { error: `Failed to save template: ${error.message}` },
      { status: 500 }
    );
  }
}
