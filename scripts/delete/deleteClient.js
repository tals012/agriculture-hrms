const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllClients() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        fields: {
          include: {
            harvests: {
              include: {
                entries: true
              }
            },
            groups: {
              include: {
                members: true
              }
            }
          }
        },
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

    if (clients.length === 0) {
      console.log("No clients found in the database");
      return;
    }

    const totalFields = clients.reduce((sum, c) => sum + c.fields.length, 0);
    const totalManagers = clients.reduce((sum, c) => sum + c.managers.length, 0);
    const totalWorkers = clients.reduce((sum, c) => sum + c.currentWorkers.length, 0);
    const totalHarvests = clients.reduce((sum, c) => 
      sum + c.fields.reduce((fSum, f) => fSum + f.harvests.length, 0), 0);
    const totalGroups = clients.reduce((sum, c) => 
      sum + c.fields.reduce((fSum, f) => fSum + f.groups.length, 0), 0);

    console.log("\nFound clients:");
    console.log(`Total clients: ${clients.length}`);
    console.log("\nSummary:");
    console.log(`Total fields: ${totalFields}`);
    console.log(`Total managers: ${totalManagers}`);
    console.log(`Total current workers: ${totalWorkers}`);
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total groups: ${totalGroups}`);

    const confirm = await question('\nAre you sure you want to delete ALL clients? This will:\n' +
      '- Delete ALL client records\n' +
      '- Delete ALL fields and their harvests\n' +
      '- Delete ALL managers and their user accounts\n' +
      '- Delete ALL worker history records\n' +
      '- Delete ALL pricing combinations\n' +
      '- Remove client references from workers\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const client of clients) {
        for (const field of client.fields) {
          await tx.harvestEntry.deleteMany({
            where: {
              harvest: {
                fieldId: field.id
              }
            }
          });

          await tx.harvest.deleteMany({
            where: { fieldId: field.id }
          });

          await tx.groupMember.deleteMany({
            where: {
              group: {
                fieldId: field.id
              }
            }
          });

          await tx.group.deleteMany({
            where: { fieldId: field.id }
          });
        }

        await tx.field.deleteMany({
          where: { clientId: client.id }
        });

        const managerUserIds = client.managers
          .filter(m => m.userId)
          .map(m => m.userId);

        if (managerUserIds.length > 0) {
          await tx.user.deleteMany({
            where: {
              id: {
                in: managerUserIds
              }
            }
          });
        }

        await tx.manager.deleteMany({
          where: { clientId: client.id }
        });

        await tx.workerClientHistory.deleteMany({
          where: { clientId: client.id }
        });

        await tx.clientPricingCombination.deleteMany({
          where: { clientId: client.id }
        });
      }

      await tx.worker.updateMany({
        where: {
          currentClientId: {
            in: clients.map(c => c.id)
          }
        },
        data: { currentClientId: null }
      });

      await tx.client.deleteMany({
        where: {
          id: {
            in: clients.map(c => c.id)
          }
        }
      });
    });

    console.log("\nAll clients and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting clients:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllClients(); 