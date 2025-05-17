// This script assigns serial numbers to existing workers based on creation date
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateWorkerSerialNumbers() {
  console.log("Starting worker serial number update...");

  try {
    // First, get all workers ordered by creation date
    const workers = await prisma.worker.findMany({
      orderBy: {
        createdAt: "asc", // Order by creation date, oldest first
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    console.log(`Found ${workers.length} workers to update`);

    // Now update each worker with a sequential serial number
    // We'll use raw queries with Prisma for this since the auto-increment
    // won't work for existing records

    // Start a transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(
      workers.map((worker, index) => {
        const serialNumber = index + 1; // Start from 1
        console.log(
          `Setting worker ${worker.id} serial number to ${serialNumber}`
        );

        // Use updateMany to bypass the auto-increment constraint
        return prisma.$executeRaw`
          UPDATE "Worker"
          SET "serialNumber" = ${serialNumber}
          WHERE id = ${worker.id}
        `;
      })
    );

    console.log("Worker serial numbers updated successfully!");
    console.log(`Updated ${result.length} worker records`);
  } catch (error) {
    console.error("Error updating worker serial numbers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateWorkerSerialNumbers()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
