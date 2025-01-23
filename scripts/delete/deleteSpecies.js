const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllSpecies() {
  try {
    const species = await prisma.species.findMany({
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

    if (species.length === 0) {
      console.log("No species found in the database");
      return;
    }

    const totalHarvests = species.reduce((sum, s) => sum + s.harvests.length, 0);
    const totalEntries = species.reduce((sum, s) => 
      sum + s.harvests.reduce((hSum, h) => hSum + h.entries.length, 0), 0);
    const uniqueFields = new Set(
      species.flatMap(s => s.harvests.map(h => h.field.id))
    ).size;

    console.log("\nFound species:");
    console.log(`Total species: ${species.length}`);
    console.log("\nSummary:");
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Fields involved: ${uniqueFields}`);

    const confirm = await question('\nAre you sure you want to delete ALL species? This will:\n' +
      '- Delete ALL species records\n' +
      '- Delete ALL associated harvests\n' +
      '- Delete ALL associated harvest entries\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process each species in its own transaction
    for (const speciesItem of species) {
      await prisma.$transaction(async (tx) => {
        // Delete harvest entries first
        await tx.harvestEntry.deleteMany({
          where: {
            harvest: {
              speciesId: speciesItem.id
            }
          }
        });

        // Delete harvests
        await tx.harvest.deleteMany({
          where: { speciesId: speciesItem.id }
        });

        // Delete the species
        await tx.species.delete({
          where: { id: speciesItem.id }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      console.log(`Deleted species: ${speciesItem.name}`);
    }

    console.log("\nAll species and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting species:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllSpecies(); 