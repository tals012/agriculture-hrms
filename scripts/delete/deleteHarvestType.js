const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllHarvestTypes() {
  try {
    const harvestTypes = await prisma.harvestType.findMany({
      include: {
        harvests: {
          include: {
            entries: true,
            field: {
              include: {
                client: true
              }
            }
          }
        }
      }
    });

    if (harvestTypes.length === 0) {
      console.log("No harvest types found in the database");
      return;
    }

    const totalHarvests = harvestTypes.reduce((sum, ht) => sum + ht.harvests.length, 0);
    const totalEntries = harvestTypes.reduce((sum, ht) => 
      sum + ht.harvests.reduce((hSum, h) => hSum + h.entries.length, 0), 0);
    const uniqueFields = new Set(
      harvestTypes.flatMap(ht => ht.harvests.map(h => h.field.id))
    ).size;

    console.log("\nFound harvest types:");
    console.log(`Total harvest types: ${harvestTypes.length}`);
    console.log("\nSummary:");
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Fields involved: ${uniqueFields}`);

    const confirm = await question('\nAre you sure you want to delete ALL harvest types? This will:\n' +
      '- Delete ALL harvest type records\n' +
      '- Delete ALL associated harvests\n' +
      '- Delete ALL associated harvest entries\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process each harvest type in its own transaction
    for (const harvestType of harvestTypes) {
      await prisma.$transaction(async (tx) => {
        // Delete harvest entries first
        await tx.harvestEntry.deleteMany({
          where: {
            harvest: {
              harvestTypeId: harvestType.id
            }
          }
        });

        // Delete harvests
        await tx.harvest.deleteMany({
          where: { harvestTypeId: harvestType.id }
        });

        // Delete the harvest type
        await tx.harvestType.delete({
          where: { id: harvestType.id }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      console.log(`Deleted harvest type: ${harvestType.name}`);
    }

    console.log("\nAll harvest types and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting harvest types:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllHarvestTypes(); 