"use server";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import JSZip from "jszip";

export async function generateBulkDocuments({ workerIds, templateIds }) {
  try {
    if (!workerIds?.length || !templateIds?.length) {
      return {
        ok: false,
        error: "Missing required parameters",
      };
    }

    console.log("Starting bulk document generation for:", {
      workerIds,
      templateIds,
    });

    // Get workers details
    const workers = await prisma.foreignWorker.findMany({
      where: {
        id: {
          in: workerIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameHebrew: true,
        lastNameHebrew: true,
        israelPhoneNumber: true,
        serialNumber: true,
      },
    });

    console.log("Found workers:", workers);

    // Get templates
    const templates = await prisma.foreignWorkerDigitalFormTemplate.findMany({
      where: {
        id: {
          in: templateIds,
        },
      },
      include: {
        templateAsset: true,
      },
    });

    console.log("Found templates:", templates);

    if (!workers.length || !templates.length) {
      return {
        ok: false,
        error: "No workers or templates found",
      };
    }

    // Create a new report record
    const report = await prisma.workerReport.create({
      data: {
        id: createId(),
        type: "BULK_DOCUMENTS",
        status: "PROCESSING",
        metadata: {
          workerCount: workers.length,
          templateCount: templates.length,
        },
      },
    });

    console.log("Created report:", report);

    // Create zip file
    const zip = new JSZip();
    const processedFiles = [];

    // For each worker and template combination
    for (const worker of workers) {
      for (const template of templates) {
        try {
          console.log(
            `Processing worker ${worker.id} with template ${template.id}`
          );

          // Create a new asset for this worker's document
          const newAsset = await prisma.asset.create({
            data: {
              id: createId(),
              filePath: template.templateAsset.filePath,
              type: template.templateAsset.type,
              status: "READY",
            },
          });

          // Create document record
          const document = await prisma.workerDocument.create({
            data: {
              name: template.name,
              type: "GENERATED_DOCUMENT",
              documentAssetId: newAsset.id,
              foreignWorkerId: worker.id,
              documentCategoryId: template.documentCategoryId,
              reportId: report.id,
            },
          });

          // Add file to zip
          const workerName = `${worker.firstName} ${worker.lastName}`.trim();
          const fileName = `${worker.serialNumber || worker.id}_${workerName}_${
            template.name
          }.pdf`;
          zip.file(fileName, template.templateAsset.filePath);
          processedFiles.push(fileName);

          console.log(`Successfully processed file: ${fileName}`);
        } catch (error) {
          console.error(
            `Error processing document for worker ${worker.id}:`,
            error
          );
        }
      }
    }

    console.log("Processed files:", processedFiles);

    if (processedFiles.length === 0) {
      await prisma.workerReport.update({
        where: { id: report.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
        },
      });

      return {
        ok: false,
        error: "No files were processed successfully",
      };
    }

    // Generate zip file
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    // Update report status
    await prisma.workerReport.update({
      where: { id: report.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log("Generation completed successfully");

    return {
      ok: true,
      data: {
        reportId: report.id,
        zipContent,
        processedFiles,
      },
    };
  } catch (error) {
    console.error("Error generating bulk documents:", error);
    return {
      ok: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
