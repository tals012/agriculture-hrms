"use server";
import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";
const link = await getSignedUrl(documentAsset.filePath);
import Joi from "joi";

const payloadSchema = Joi.object({
  foreignWorkerId: Joi.string().required(),
});

export const getUploadedDocuments = async (data) => {
  await payloadSchema.validateAsync(data);
  const { foreignWorkerId } = data;

  try {
    console.log("Fetching documents for worker:", foreignWorkerId);
    const documents = await prisma.workerDocument.findMany({
      where: {
        foreignWorkerId,
      },
      include: {
        simpleCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        documentAsset: {
          select: {
            filePath: true,
          },
        },
        uploadedByUser: {
          select: {
            name: true,
          },
        },
        bulkSigningSession: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get signed URLs and format documents
    const formattedDocuments = await Promise.all(
      documents.map(async (doc) => {
        let link = null;
        let slug = doc.slug;
        let bulkSigningSessionSlug = null;
        try {
          if (doc.documentAsset?.filePath) {
            if (
              doc.type === "REMOTE_DOCUMENT" &&
              !doc.slug &&
              !doc.isRemoteDocSubmitted
            ) {
              if (doc.bulkSigningSession) {
                link = `${process.env.NEXT_PUBLIC_API_URL}/worker-documents/${doc.bulkSigningSession.slug}`;
                bulkSigningSessionSlug = doc.bulkSigningSession.slug;
              } else {
                link = await getSignedUrl(doc.documentAsset.filePath);
              }
            } else {
              link = await getSignedUrl(doc.documentAsset.filePath);
            }
          }
        } catch (e) {
          console.error("Error getting signed URL:", e);
        }

        const formatted = {
          id: doc.id,
          name: doc.name,
          createdAt: doc.createdAt,
          link,
          simpleCategoryId: doc.simpleCategoryId || "",
          category: doc.simpleCategory?.name || "-",
          note: doc.note,
          slug,
          bulkSigningSessionSlug,
          uploadedByUser: doc.uploadedByUser?.name,
          isRemoteDocSubmitted: doc.isRemoteDocSubmitted,
          remoteDocSmsStatusAt: doc.remoteDocSmsStatusAt,
          remoteDocSubmittedAt: doc.remoteDocSubmittedAt,
          remoteDocInitiatedAt: doc.remoteDocInitiatedAt,
          type: doc.type,
          remoteDocSmsStatus: doc.remoteDocSmsStatus,
          isRemoteDocPasswordProtected: doc.isRemoteDocPasswordProtected,
          isRemoteDocRead: doc.isRemoteDocRead,
          remoteDocReadAt: doc.remoteDocReadAt,
        };

        console.log("Formatted document:", JSON.stringify(formatted, null, 2));
        return formatted;
      })
    );

    console.log(
      "Final formatted documents:",
      JSON.stringify(formattedDocuments, null, 2)
    );
    return { ok: true, data: formattedDocuments };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { ok: false, error: error.message };
  }
};
