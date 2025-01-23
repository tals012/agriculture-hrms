const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteField() {
  try {
    const fieldId = await question('Enter field ID to delete: ');

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        client: true,
        manager: true,
        groups: {
          include: {
            members: true,
            clientPricingCombination: true
          }
        },
        harvests: {
          include: {
            entries: true
          }
        }
      }
    });

    if (!field) {
      console.log("Field not found");
      return;
    }

    console.log("\nField found:");
    console.log(`Name: ${field.name}`);
    console.log(`Client: ${field.client.name}`);
    console.log(`Groups: ${field.groups.length}`);
    console.log(`Harvests: ${field.harvests.length}`);
    console.log(`Total Harvest Entries: ${field.harvests.reduce((sum, h) => sum + h.entries.length, 0)}`);
    
    const confirm = await question('\nAre you sure you want to delete this field? This will also delete:\n' +
      '- All groups and their member associations\n' +
      '- All group leader user accounts\n' +
      '- All harvests and harvest entries\n' +
      '- All pricing combinations linked to groups\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const group of field.groups) {
        const groupLeaders = group.members.filter(member => member.isGroupLeader);
        for (const leader of groupLeaders) {
          const worker = await tx.worker.findUnique({
            where: { id: leader.workerId },
            include: { user: true }
          });
          if (worker?.userId) {
            await tx.user.delete({
              where: { id: worker.userId }
            });
          }
        }

        await tx.clientPricingCombination.updateMany({
          where: {
            groups: {
              some: {
                id: group.id
              }
            }
          },
          data: {
            groups: {
              disconnect: {
                id: group.id
              }
            }
          }
        });

        await tx.groupMember.deleteMany({
          where: { groupId: group.id }
        });
      }

      await tx.group.deleteMany({
        where: { fieldId }
      });

      for (const harvest of field.harvests) {
        await tx.harvestEntry.deleteMany({
          where: { harvestId: harvest.id }
        });
      }
      await tx.harvest.deleteMany({
        where: { fieldId }
      });

      await tx.field.delete({
        where: { id: fieldId }
      });
    });

    console.log("\nField and all related records deleted successfully");

  } catch (error) {
    console.error("Error deleting field:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteField(); 