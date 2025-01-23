const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteClient() {
  try {
    const clientId = await question('Enter client ID to delete: ');

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        fields: true,
        managers: {
          include: {
            user: true
          }
        },
        currentWorkers: true,
        workerHistory: true,
        clientPricingCombination: true
      }
    });

    if (!client) {
      console.log("Client not found");
      return;
    }

    console.log("\nClient found:");
    console.log(`Name: ${client.name}`);
    console.log(`Fields: ${client.fields.length}`);
    console.log(`Managers: ${client.managers.length}`);
    console.log(`Current Workers: ${client.currentWorkers.length}`);
    console.log(`Historical Records: ${client.workerHistory.length}`);
    
    const confirm = await question('\nAre you sure you want to delete this client? This will also delete:\n' +
      '- All fields and their harvests\n' +
      '- All managers and their user accounts\n' +
      '- All worker history records\n' +
      '- All pricing combinations\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const field of client.fields) {
        const harvests = await tx.harvest.findMany({
          where: { fieldId: field.id }
        });
        
        for (const harvest of harvests) {
          await tx.harvestEntry.deleteMany({
            where: { harvestId: harvest.id }
          });
        }
        
        await tx.harvest.deleteMany({
          where: { fieldId: field.id }
        });
      }

      await tx.field.deleteMany({
        where: { clientId }
      });

      for (const manager of client.managers) {
        if (manager.userId) {
          await tx.user.delete({
            where: { id: manager.userId }
          });
        }
      }
      await tx.manager.deleteMany({
        where: { clientId }
      });

      await tx.workerClientHistory.deleteMany({
        where: { clientId }
      });

      await tx.clientPricingCombination.deleteMany({
        where: { clientId }
      });

      await tx.worker.updateMany({
        where: { currentClientId: clientId },
        data: { currentClientId: null }
      });

      await tx.client.delete({
        where: { id: clientId }
      });
    });

    console.log("\nClient and all related records deleted successfully");

  } catch (error) {
    console.error("Error deleting client:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteClient(); 