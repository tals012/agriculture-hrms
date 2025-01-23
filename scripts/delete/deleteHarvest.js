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
        field: {
          include: {
            client: true
          }
        },
        entries: {
          include: {
            worker: true
          }
        },
        harvestType: true
      }
    });

    if (harvests.length === 0) {
      console.log("No harvests found in the database");
      return;
    }

    const totalEntries = harvests.reduce((sum, h) => sum + h.entries.length, 0);
    const uniqueWorkers = new Set(
      harvests.flatMap(h => h.entries.map(e => e.worker.id))
    ).size;
    const uniqueFields = new Set(harvests.map(h => h.field.id)).size;

    console.log("\nFound harvests:");
    console.log(`Total harvests: ${harvests.length}`);
    console.log("\nSummary:");
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Unique workers involved: ${uniqueWorkers}`);
    console.log(`Fields involved: ${uniqueFields}`);

    const confirm = await question('\nAre you sure you want to delete ALL harvests? This will:\n' +
      '- Delete ALL harvest records\n' +
      '- Delete ALL harvest entries\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process each harvest in its own transaction
    for (const harvest of harvests) {
      await prisma.$transaction(async (tx) => {
        // Delete harvest entries first
        await tx.harvestEntry.deleteMany({
          where: { harvestId: harvest.id }
        });

        // Delete the harvest
        await tx.harvest.delete({
          where: { id: harvest.id }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      console.log(`Deleted harvest: ${harvest.harvestType.name} from ${harvest.field.name} (Client: ${harvest.field.client.name})`);
    }

    console.log("\nAll harvests and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting harvests:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllHarvests(); 