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
            entries: true
          }
        },
        clientPricingCombination: true,
        organization: true
      }
    });

    if (harvestTypes.length === 0) {
      console.log("No harvest types found in the database");
      return;
    }

    const totalHarvests = harvestTypes.reduce((sum, ht) => sum + ht.harvests.length, 0);
    const totalEntries = harvestTypes.reduce((sum, ht) => 
      sum + ht.harvests.reduce((hSum, h) => hSum + h.entries.length, 0), 0);
    const totalPricingCombinations = harvestTypes.reduce((sum, ht) => 
      sum + ht.clientPricingCombination.length, 0);

    console.log("\nFound harvest types:");
    console.log(`Total harvest types: ${harvestTypes.length}`);
    console.log("\nSummary:");
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Total pricing combinations: ${totalPricingCombinations}`);

    const confirm = await question('\nAre you sure you want to delete ALL harvest types? This will:\n' +
      '- Delete ALL harvest type records\n' +
      '- Delete ALL harvests of these types\n' +
      '- Delete ALL harvest entries\n' +
      '- Delete ALL pricing combinations\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.harvestEntry.deleteMany({
        where: {
          harvest: {
            harvestTypeId: {
              in: harvestTypes.map(ht => ht.id)
            }
          }
        }
      });

      await tx.harvest.deleteMany({
        where: {
          harvestTypeId: {
            in: harvestTypes.map(ht => ht.id)
          }
        }
      });

      await tx.clientPricingCombination.deleteMany({
        where: {
          harvestTypeId: {
            in: harvestTypes.map(ht => ht.id)
          }
        }
      });

      await tx.harvestType.deleteMany({
        where: {
          id: {
            in: harvestTypes.map(ht => ht.id)
          }
        }
      });
    });

    console.log("\nAll harvest types and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting harvest types:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllHarvestTypes(); 