// This script copies Hebrew names to English name fields for workers
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function copyHebrewNamesToEnglish() {
  console.log("Starting to copy Hebrew names to English name fields...");

  try {
    // Get all workers with Hebrew names but missing English names
    const workers = await prisma.worker.findMany({
      where: {
        OR: [
          {
            nameHe: { not: null },
            name: null,
          },
          {
            surnameHe: { not: null },
            surname: null,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        nameHe: true,
        surname: true,
        surnameHe: true,
      },
    });

    console.log(`Found ${workers.length} workers that need name updates`);

    // Start a transaction for all updates
    const updates = workers
      .map((worker) => {
        const updateData = {};

        // Only copy if Hebrew name exists and English name is null/empty
        if (worker.nameHe && !worker.name) {
          updateData.name = worker.nameHe;
          console.log(
            `Worker ${worker.id}: Copying nameHe '${worker.nameHe}' to name`
          );
        }

        if (worker.surnameHe && !worker.surname) {
          updateData.surname = worker.surnameHe;
          console.log(
            `Worker ${worker.id}: Copying surnameHe '${worker.surnameHe}' to surname`
          );
        }

        // Only update if there's something to update
        if (Object.keys(updateData).length > 0) {
          return prisma.worker.update({
            where: { id: worker.id },
            data: updateData,
          });
        }

        // If nothing to update, return null (will be filtered out)
        return null;
      })
      .filter(Boolean); // Remove null entries (workers that don't need updates)

    if (updates.length === 0) {
      console.log("No workers need updates");
      return;
    }

    // Execute all updates in a transaction
    const result = await prisma.$transaction(updates);

    console.log(`Successfully updated ${result.length} workers`);

    // Print a summary of what was updated
    console.log("\nUpdate Summary:");
    result.forEach((worker) => {
      console.log(
        `Worker ID ${worker.id}: name='${worker.name}', surname='${worker.surname}'`
      );
    });
  } catch (error) {
    console.error("Error updating worker names:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
copyHebrewNamesToEnglish()
  .then(() => {
    console.log("\nScript completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
