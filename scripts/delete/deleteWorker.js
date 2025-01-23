const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteWorker() {
  try {
    const workerId = await question('Enter worker ID to delete: ');

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        user: true,
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!worker) {
      console.log("Worker not found");
      return;
    }

    console.log("\nWorker found:");
    console.log(`Name: ${worker.name || worker.nameHe}`);
    console.log(`Worker Code: ${worker.workerCode}`);
    console.log(`Groups: ${worker.groups.length}`);
    
    const confirm = await question('\nAre you sure you want to delete this worker? This will also delete:\n' +
      '- All group memberships\n' +
      '- Work history records\n' +
      '- Harvest entries\n' +
      '- User account (if exists)\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.harvestEntry.deleteMany({
        where: { workerId }
      });

      await tx.groupMember.deleteMany({
        where: { workerId }
      });

      await tx.workerClientHistory.deleteMany({
        where: { workerId }
      });

      if (worker.userId) {
        await tx.user.delete({
          where: { id: worker.userId }
        });
      }

      await tx.worker.delete({
        where: { id: workerId }
      });
    });

    console.log("\nWorker and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting worker:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteWorker(); 