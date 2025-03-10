"use server";

import prisma from "@/lib/prisma";
import { sendSms } from "@/app/actions/sms/sendSms";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { createId } from "@paralleldrive/cuid2";

export async function sendBulkRemoteSignatureWithSingleLink({
  workerIds,
  templateIds,
}) {
  console.log("=== Starting Bulk Remote Signature Send ===");
  console.log("Parameters:", { workerIds, templateIds });

  const getUniqueSlug = async () => {
    console.log("Getting unique slug, prisma:", prisma);
    let slug;
    let isUnique = false;

    while (!isUnique) {
      slug = nanoid(10);
      // console.log("Checking slug:", slug);
      const existingSession = await prisma.workerBulkSigningSession.findFirst({
        where: { slug },
      });
      isUnique = !existingSession;
    }

    return slug;
  };

  // Utility function to process workers in batches
  async function processBatch(workers, batchSize = 3) {
    console.log(`Starting batch processing with batch size: ${batchSize}`);
    console.log(`Total workers to process: ${workers.length}`);

    const batches = [];
    for (let i = 0; i < workers.length; i += batchSize) {
      const batch = workers.slice(i, i + batchSize);
      console.log(
        `Created batch ${batches.length + 1} with ${batch.length} workers`
      );
      batches.push(batch);
    }

    console.log(`Total batches created: ${batches.length}`);
    return batches;
  }

  // Utility function to delay between batches
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    if (!workerIds?.length || !templateIds?.length) {
      console.error("Missing required parameters:", { workerIds, templateIds });
      return {
        ok: false,
        error: "Missing required parameters",
      };
    }

    const results = {
      success: [],
      errors: [],
      stats: {
        total: workerIds.length,
        processed: 0,
        success: 0,
        failed: 0,
        noPhone: 0,
      },
    };

    // Get all workers first
    const workers = await prisma.foreignWorker.findMany({
      where: {
        id: { in: workerIds },
      },
      select: {
        id: true,
        israelPhoneNumber: true,
        countryId: true,
      },
    });

    console.log(`Found ${workers.length} workers to process`);

    // Process workers in batches
    const workerBatches = await processBatch(workers);

    for (let batchIndex = 0; batchIndex < workerBatches.length; batchIndex++) {
      const batch = workerBatches[batchIndex];
      console.log(
        `\nProcessing Batch ${batchIndex + 1}/${workerBatches.length}`
      );
      console.log(`Batch size: ${batch.length} workers`);

      for (const worker of batch) {
        console.log(`\n--- Processing Worker: ${worker.id} ---`);
        results.stats.processed++;

        try {
          if (!worker.israelPhoneNumber) {
            console.log("Worker has no phone number");
            results.stats.noPhone++;
            results.errors.push({
              workerId: worker.id,
              error: "Worker has no phone number",
            });
            continue;
          }

          const slug = await getUniqueSlug();
          const _password = String(Math.floor(1000 + Math.random() * 9000));
          const password = await bcrypt.hash(_password, 10);

          console.log("Creating session...");
          const session = await prisma.workerBulkSigningSession.create({
            data: {
              foreignWorkerId: worker.id,
              slug,
              initiatedAt: new Date(),
              smsStatus: "PENDING",
              smsStatusAt: new Date(),
              isPasswordProtected: true,
              password,
              authMode: "PHONE_OTP",
            },
          });

          console.log("Processing templates...");
          for (const templateId of templateIds) {
            const template =
              await prisma.foreignWorkerDigitalFormTemplate.findUnique({
                where: { id: templateId },
                include: {
                  templateAsset: true,
                },
              });

            if (!template) {
              console.error(`Template not found: ${templateId}`);
              continue;
            }

            console.log(`Creating document from template: ${templateId}`);

            // Create a new asset for this worker's document
            const newAsset = await prisma.asset.create({
              data: {
                id: createId(),
                filePath: template.templateAsset.filePath,
                type: template.templateAsset.type,
                status: "READY",
              },
            });

            // Create document with the new asset
            await prisma.workerDocument.create({
              data: {
                name: template.name,
                type: "REMOTE_DOCUMENT",
                documentAssetId: newAsset.id,
                foreignWorkerId: worker.id,
                bulkSigningSessionId: session.id,
                documentCategoryId: template.documentCategoryId,
                isRemoteDocRead: false,
                isRemoteDocSubmitted: false,
                remoteDocInitiatedAt: new Date(),
                remoteDocSmsStatus: "PENDING",
                remoteDocSmsStatusAt: new Date(),
                isRemoteDocPasswordProtected: true,
                remoteDocPassword: password,
                authMode: "PHONE_OTP",
              },
            });
          }

          console.log("Sending SMS...");
          // Send SMS with retry logic
          let smsSuccess = false;
          let retryCount = 0;
          const maxRetries = 3;

          while (!smsSuccess && retryCount < maxRetries) {
            console.log(`SMS Attempt ${retryCount + 1}/${maxRetries}`);
            try {
              smsSuccess = await sendSms({
                phone: worker.israelPhoneNumber,
                message: `יש לך מסמכים חדשים לחתימה. אנא היכנס לקישור הבא: ${process.env.NEXT_PUBLIC_API_URL}/worker-documents/${slug} \nסיסמה: ${_password}`,
              });
              console.log("SMS send result:", smsSuccess);
            } catch (error) {
              console.error(
                `SMS sending error (attempt ${retryCount + 1}):`,
                error
              );
            }

            if (!smsSuccess) {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(
                  `Waiting 2 seconds before retry ${retryCount + 1}...`
                );
                await delay(2000);
              }
            }
          }

          // Update session status
          await prisma.workerBulkSigningSession.update({
            where: { id: session.id },
            data: {
              smsStatus: smsSuccess ? "COMPLETED" : "FAILED",
              smsStatusAt: new Date(),
            },
          });

          if (smsSuccess) {
            console.log("SMS sent successfully");
            results.stats.success++;
            results.success.push({
              workerId: worker.id,
              sessionId: session.id,
              smsStatus: "COMPLETED",
              retryCount,
            });
          } else {
            console.log("SMS sending failed after all retries");
            results.stats.failed++;
            results.errors.push({
              workerId: worker.id,
              sessionId: session.id,
              smsStatus: "FAILED",
              error: "Failed to send SMS after retries",
              retryCount,
            });

            // Clean up failed session
            await prisma.workerBulkSigningSession.delete({
              where: { id: session.id },
            });
          }

          // Add a small delay between each worker in a batch to avoid overwhelming the SMS gateway
          await delay(1000);
        } catch (error) {
          console.error(`Error processing worker ${worker.id}:`, error);
          results.stats.failed++;
          results.errors.push({
            workerId: worker.id,
            error: error.message,
          });
        }
      }

      // Add delay between batches if not the last batch
      if (batchIndex < workerBatches.length - 1) {
        console.log("\nWaiting 10 seconds before next batch...");
        await delay(10000);
      }
    }

    console.log("\n=== Bulk Send Complete ===");
    console.log("Final Results:", results);

    return {
      ok: true,
      data: results,
    };
  } catch (error) {
    console.error("Bulk send failed with error:", error);
    return {
      ok: false,
      error: error.message,
    };
  }
}
