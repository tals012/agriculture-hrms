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
                members: true,
                workingSchedule: true,
                workerAttendance: true
              }
            },
            workingSchedule: true
          }
        },
        managers: {
          include: {
            user: true,
            workerAttendance: true
          }
        },
        currentWorkers: true,
        workerHistory: true,
        clientPricingCombination: {
          include: {
            workerAttendance: true
          }
        },
        workingSchedule: true
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
    const totalWorkingSchedules = clients.reduce((sum, c) => 
      sum + c.workingSchedule.length + 
      c.fields.reduce((fSum, f) => fSum + f.workingSchedule.length, 0) +
      c.fields.reduce((fSum, f) => fSum + f.groups.reduce((gSum, g) => gSum + g.workingSchedule.length, 0), 0), 0);

    console.log("\nFound clients:");
    console.log(`Total clients: ${clients.length}`);
    console.log("\nSummary:");
    console.log(`Total fields: ${totalFields}`);
    console.log(`Total managers: ${totalManagers}`);
    console.log(`Total current workers: ${totalWorkers}`);
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total groups: ${totalGroups}`);
    console.log(`Total working schedules: ${totalWorkingSchedules}`);

    const confirm = await question('\nAre you sure you want to delete ALL clients? This will:\n' +
      '- Delete ALL client records\n' +
      '- Delete ALL fields and their harvests\n' +
      '- Delete ALL managers and their user accounts\n' +
      '- Delete ALL worker history records\n' +
      '- Delete ALL pricing combinations\n' +
      '- Delete ALL working schedules\n' +
      '- Remove client references from workers\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process in chunks to avoid transaction timeout
    for (const client of clients) {
      await prisma.$transaction(async (tx) => {
        // Delete worker attendance records for all related entities
        await tx.workerAttendance.deleteMany({
          where: {
            OR: [
              {
                group: {
                  field: {
                    clientId: client.id
                  }
                }
              },
              {
                manager: {
                  clientId: client.id
                }
              },
              {
                combination: {
                  clientId: client.id
                }
              }
            ]
          }
        });

        // Delete harvest entries and harvests for each field
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

          // Delete group members and groups
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

          // Delete working schedules for fields
          await tx.workingSchedule.deleteMany({
            where: { fieldId: field.id }
          });
        }

        // Delete fields
        await tx.field.deleteMany({
          where: { clientId: client.id }
        });

        // Delete manager user accounts and managers
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

        // Delete worker history and pricing combinations
        await tx.workerClientHistory.deleteMany({
          where: { clientId: client.id }
        });

        await tx.clientPricingCombination.deleteMany({
          where: { clientId: client.id }
        });

        // Delete working schedules for client
        await tx.workingSchedule.deleteMany({
          where: { clientId: client.id }
        });

        // Update worker references
        await tx.worker.updateMany({
          where: { currentClientId: client.id },
          data: { currentClientId: null }
        });

        // Delete the client
        await tx.client.delete({
          where: { id: client.id }
        });
      }, {
        timeout: 30000 // 30 second timeout for each transaction
      });

      console.log(`Deleted client: ${client.name}`);
    }

    console.log("\nAll clients and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting clients:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllClients(); 