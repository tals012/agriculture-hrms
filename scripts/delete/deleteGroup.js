const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteGroup() {
  try {
    const groupId = await question('Enter group ID to delete: ');

    const group = await prisma.group.findUnique({
      where: { id: groupId },
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

    if (!group) {
      console.log("Group not found");
      return;
    }

    console.log("\nGroup found:");
    console.log(`Name: ${group.name}`);
    console.log(`Field: ${group.field.name}`);
    console.log(`Members: ${group.members.length}`);
    console.log(`Pricing Combinations: ${group.clientPricingCombination.length}`);
    
    const confirm = await question('\nAre you sure you want to delete this group? This will also delete:\n' +
      '- All member associations\n' +
      '- Group leader user accounts\n' +
      '- Pricing combination links\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      const groupLeaders = group.members.filter(member => member.isGroupLeader);
      for (const leader of groupLeaders) {
        if (leader.worker.userId) {
          await tx.user.delete({
            where: { id: leader.worker.userId }
          });
        }
      }

      await tx.clientPricingCombination.updateMany({
        where: {
          groups: {
            some: {
              id: groupId
            }
          }
        },
        data: {
          groups: {
            disconnect: {
              id: groupId
            }
          }
        }
      });

      await tx.groupMember.deleteMany({
        where: { groupId }
      });

      await tx.group.delete({
        where: { id: groupId }
      });
    });

    console.log("\nGroup and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting group:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteGroup(); 