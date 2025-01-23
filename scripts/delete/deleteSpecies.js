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
            entries: true
          }
        },
        clientPricingCombination: true,
        organization: true
      }
    });

    if (species.length === 0) {
      console.log("No species found in the database");
      return;
    }

    const totalHarvests = species.reduce((sum, s) => sum + s.harvests.length, 0);
    const totalEntries = species.reduce((sum, s) => 
      sum + s.harvests.reduce((hSum, h) => hSum + h.entries.length, 0), 0);
    const totalPricingCombinations = species.reduce((sum, s) => 
      sum + s.clientPricingCombination.length, 0);

    console.log("\nFound species:");
    console.log(`Total species: ${species.length}`);
    console.log("\nSummary:");
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Total pricing combinations: ${totalPricingCombinations}`);

    const confirm = await question('\nAre you sure you want to delete ALL species? This will:\n' +
      '- Delete ALL species records\n' +
      '- Delete ALL harvests of these species\n' +
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
            speciesId: {
              in: species.map(s => s.id)
            }
          }
        }
      });

      await tx.harvest.deleteMany({
        where: {
          speciesId: {
            in: species.map(s => s.id)
          }
        }
      });

      await tx.clientPricingCombination.deleteMany({
        where: {
          speciesId: {
            in: species.map(s => s.id)
          }
        }
      });

      await tx.species.deleteMany({
        where: {
          id: {
            in: species.map(s => s.id)
          }
        }
      });
    });

    console.log("\nAll species and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting species:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllSpecies(); 