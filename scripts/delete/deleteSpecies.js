const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteSpecies() {
  try {
    const speciesId = await question('Enter species ID to delete: ');

    const species = await prisma.species.findUnique({
      where: { id: speciesId },
      include: {
        harvests: {
          include: {
            entries: true
          }
        },
        clientPricingCombination: true
      }
    });

    if (!species) {
      console.log("Species not found");
      return;
    }

    console.log("\nSpecies found:");
    console.log(`Name: ${species.name}`);
    console.log(`Description: ${species.description || 'No description'}`);
    console.log(`Total Harvests: ${species.harvests.length}`);
    console.log(`Total Harvest Entries: ${species.harvests.reduce((sum, h) => sum + h.entries.length, 0)}`);
    console.log(`Pricing Combinations: ${species.clientPricingCombination.length}`);
    
    const confirm = await question('\nAre you sure you want to delete this species? This will also delete:\n' +
      '- All harvests of this species\n' +
      '- All harvest entries\n' +
      '- All pricing combinations\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const harvest of species.harvests) {
        await tx.harvestEntry.deleteMany({
          where: { harvestId: harvest.id }
        });
      }
      await tx.harvest.deleteMany({
        where: { speciesId }
      });

      await tx.clientPricingCombination.deleteMany({
        where: { speciesId }
      });

      await tx.species.delete({
        where: { id: speciesId }
      });
    });

    console.log("\nSpecies and all related records deleted successfully");

  } catch (error) {
    console.error("Error deleting species:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteSpecies(); 