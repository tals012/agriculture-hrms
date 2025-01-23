const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllWorkers() {
  try {
    const workers = await prisma.worker.findMany({
      include: {
        user: true,
        groups: {
          include: {
            group: true
          }
        },
        harvestEntries: true,
        clientHistory: true,
        currentClient: true
      }
    });

    if (workers.length === 0) {
      console.log("No workers found in the database");
      return;
    }

    const totalGroups = workers.reduce((sum, w) => sum + w.groups.length, 0);
    const totalHarvestEntries = workers.reduce((sum, w) => sum + w.harvestEntries.length, 0);
    const totalHistory = workers.reduce((sum, w) => sum + w.clientHistory.length, 0);
    const totalUserAccounts = workers.filter(w => w.user).length;
    const totalGroupLeaders = workers.filter(w => w.groups.some(g => g.isGroupLeader)).length;

    console.log("\nFound workers:");
    console.log(`Total workers: ${workers.length}`);
    console.log("\nSummary:");
    console.log(`Total group memberships: ${totalGroups}`);
    console.log(`Total harvest entries: ${totalHarvestEntries}`);
    console.log(`Total history records: ${totalHistory}`);
    console.log(`Workers with user accounts: ${totalUserAccounts}`);
    console.log(`Group leaders: ${totalGroupLeaders}`);

    const confirm = await question('\nAre you sure you want to delete ALL workers? This will:\n' +
      '- Delete ALL worker records\n' +
      '- Delete ALL group memberships\n' +
      '- Delete ALL harvest entries\n' +
      '- Delete ALL work history records\n' +
      '- Delete associated user accounts\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.harvestEntry.deleteMany({
        where: {
          workerId: {
            in: workers.map(w => w.id)
          }
        }
      });

      await tx.groupMember.deleteMany({
        where: {
          workerId: {
            in: workers.map(w => w.id)
          }
        }
      });

      await tx.workerClientHistory.deleteMany({
        where: {
          workerId: {
            in: workers.map(w => w.id)
          }
        }
      });

      const userIds = workers
        .filter(w => w.userId)
        .map(w => w.userId);

      if (userIds.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: {
              in: userIds
            }
          }
        });
      }

      await tx.worker.deleteMany({
        where: {
          id: {
            in: workers.map(w => w.id)
          }
        }
      });
    });

    console.log("\nAll workers and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting workers:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllWorkers(); 