const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllHarvests() {
  try {
    const harvests = await prisma.harvest.findMany({
      include: {
        field: true,
        species: true,
        harvestType: true,
        entries: {
          include: {
            worker: true
          }
        }
      }
    });

    if (harvests.length === 0) {
      console.log("No harvests found in the database");
      return;
    }

    const totalEntries = harvests.reduce((sum, h) => sum + h.entries.length, 0);
    const totalWorkers = new Set(harvests.flatMap(h => h.entries.map(e => e.worker.id))).size;
    const totalFields = new Set(harvests.map(h => h.field.id)).size;

    console.log("\nFound harvests:");
    console.log(`Total harvests: ${harvests.length}`);
    console.log("\nSummary:");
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Unique workers involved: ${totalWorkers}`);
    console.log(`Fields involved: ${totalFields}`);

    const confirm = await question('\nAre you sure you want to delete ALL harvests? This will:\n' +
      '- Delete ALL harvest records\n' +
      '- Delete ALL harvest entries\n' +
      '- Delete ALL worker productivity records\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.harvestEntry.deleteMany({
        where: {
          harvestId: {
            in: harvests.map(h => h.id)
          }
        }
      });

      await tx.harvest.deleteMany({
        where: {
          id: {
            in: harvests.map(h => h.id)
          }
        }
      });
    });

    console.log("\nAll harvests and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting harvests:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllHarvests(); 