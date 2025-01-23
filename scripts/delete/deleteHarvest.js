const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteHarvest() {
  try {
    const harvestId = await question('Enter harvest ID to delete: ');

    const harvest = await prisma.harvest.findUnique({
      where: { id: harvestId },
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

    if (!harvest) {
      console.log("Harvest not found");
      return;
    }

    console.log("\nHarvest found:");
    console.log(`Date: ${harvest.date.toLocaleDateString()}`);
    console.log(`Field: ${harvest.field.name}`);
    console.log(`Species: ${harvest.species.name}`);
    console.log(`Harvest Type: ${harvest.harvestType.name}`);
    console.log(`Total Entries: ${harvest.entries.length}`);
    
    const confirm = await question('\nAre you sure you want to delete this harvest? This will also delete:\n' +
      '- All harvest entries\n' +
      '- All worker productivity records for this harvest\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.harvestEntry.deleteMany({
        where: { harvestId }
      });

      await tx.harvest.delete({
        where: { id: harvestId }
      });
    });

    console.log("\nHarvest and all entries deleted successfully");

  } catch (error) {
    console.error("Error deleting harvest:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteHarvest(); 