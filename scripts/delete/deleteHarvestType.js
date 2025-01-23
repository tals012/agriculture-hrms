const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteHarvestType() {
  try {
    const harvestTypeId = await question('Enter harvest type ID to delete: ');

    const harvestType = await prisma.harvestType.findUnique({
      where: { id: harvestTypeId },
      include: {
        harvests: {
          include: {
            entries: true
          }
        },
        clientPricingCombination: true
      }
    });

    if (!harvestType) {
      console.log("Harvest type not found");
      return;
    }

    console.log("\nHarvest Type found:");
    console.log(`Name: ${harvestType.name}`);
    console.log(`Description: ${harvestType.description || 'No description'}`);
    console.log(`Total Harvests: ${harvestType.harvests.length}`);
    console.log(`Total Harvest Entries: ${harvestType.harvests.reduce((sum, h) => sum + h.entries.length, 0)}`);
    console.log(`Pricing Combinations: ${harvestType.clientPricingCombination.length}`);
    
    const confirm = await question('\nAre you sure you want to delete this harvest type? This will also delete:\n' +
      '- All harvests of this type\n' +
      '- All harvest entries\n' +
      '- All pricing combinations\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const harvest of harvestType.harvests) {
        await tx.harvestEntry.deleteMany({
          where: { harvestId: harvest.id }
        });
      }
      await tx.harvest.deleteMany({
        where: { harvestTypeId }
      });

      await tx.clientPricingCombination.deleteMany({
        where: { harvestTypeId }
      });

      await tx.harvestType.delete({
        where: { id: harvestTypeId }
      });
    });

    console.log("\nHarvest type and all related records deleted successfully");

  } catch (error) {
    console.error("Error deleting harvest type:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteHarvestType(); 