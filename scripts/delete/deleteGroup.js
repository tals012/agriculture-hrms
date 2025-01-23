const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllGroups() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        field: true,
        members: {
          include: {
            worker: {
              include: {
                user: true
              }
            }
          }
        },
        clientPricingCombination: true
      }
    });

    if (groups.length === 0) {
      console.log("No groups found in the database");
      return;
    }

    const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
    const totalLeaders = groups.reduce((sum, g) => 
      sum + g.members.filter(m => m.isGroupLeader).length, 0);
    const totalPricingCombinations = groups.reduce((sum, g) => 
      sum + g.clientPricingCombination.length, 0);

    console.log("\nFound groups:");
    console.log(`Total groups: ${groups.length}`);
    console.log("\nSummary:");
    console.log(`Total members: ${totalMembers}`);
    console.log(`Total group leaders: ${totalLeaders}`);
    console.log(`Total pricing combinations: ${totalPricingCombinations}`);

    const confirm = await question('\nAre you sure you want to delete ALL groups? This will:\n' +
      '- Delete ALL group records\n' +
      '- Delete ALL member associations\n' +
      '- Delete group leader user accounts\n' +
      '- Remove group references from pricing combinations\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      const groupLeaderUserIds = groups
        .flatMap(g => g.members)
        .filter(m => m.isGroupLeader && m.worker.userId)
        .map(m => m.worker.userId);

      if (groupLeaderUserIds.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: {
              in: groupLeaderUserIds
            }
          }
        });
      }

      await tx.clientPricingCombination.updateMany({
        where: {
          groups: {
            some: {
              id: {
                in: groups.map(g => g.id)
              }
            }
          }
        },
        data: {
          groups: {
            disconnect: groups.map(g => ({ id: g.id }))
          }
        }
      });

      await tx.groupMember.deleteMany({
        where: {
          groupId: {
            in: groups.map(g => g.id)
          }
        }
      });

      await tx.group.deleteMany({
        where: {
          id: {
            in: groups.map(g => g.id)
          }
        }
      });
    });

    console.log("\nAll groups and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting groups:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllGroups(); 