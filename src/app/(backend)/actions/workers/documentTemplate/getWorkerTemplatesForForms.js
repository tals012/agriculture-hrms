"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

/**
 * Get worker form templates
 * 
 * @returns {Promise<{ok: boolean, data?: Array, message?: string}>} Result with templates
 */
export async function getWorkerTemplatesForForms() {
  try {
    const templates = await prisma.workerDigitalFormTemplate.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        templateAsset: true,
        templateCategory: true
      }
    });


    // Format templates for use with the form editor
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      category: template.templateCategory?.name || null,
      link: `/api/templates/${template.id}`, // You'll need to create this API route
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }));

    console.log(formattedTemplates, "formattedTemplates");

    return {
      ok: true,
      data: formattedTemplates
    };
  } catch (error) {
    console.error("Error fetching worker form templates:", error);
    return { ok: false, message: error.message };
  }
} 