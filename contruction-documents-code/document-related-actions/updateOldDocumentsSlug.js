"use server";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

export const updateOldDocumentsSlug = async () => {
  try {
    // Find all documents without a slug or with empty slug
    const documentsWithoutSlug = await prisma.workerDocument.findMany({
      where: {
        OR: [{ slug: null }, { slug: "" }],
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      `Found ${documentsWithoutSlug.length} documents without valid slugs`
    );

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Update each document with a new slug
    for (const doc of documentsWithoutSlug) {
      try {
        const newSlug = nanoid(10); // Generate a 10-character unique slug
        await prisma.workerDocument.update({
          where: { id: doc.id },
          data: { slug: newSlug },
        });
        successCount++;
        console.log(
          `Updated document ${doc.name} (${doc.id}) with new slug: ${newSlug}`
        );
      } catch (err) {
        errorCount++;
        errors.push({ id: doc.id, name: doc.name, error: err.message });
        console.error(
          `Failed to update document ${doc.name} (${doc.id}):`,
          err
        );
      }
    }

    return {
      ok: true,
      message: `Updated ${successCount} documents with new slugs. Failed: ${errorCount}`,
      details: {
        total: documentsWithoutSlug.length,
        success: successCount,
        failed: errorCount,
        errors: errors,
      },
    };
  } catch (error) {
    console.error("Error updating document slugs:", error);
    return {
      ok: false,
      error: error.message,
      details: {
        error: error.message,
        stack: error.stack,
      },
    };
  }
};
