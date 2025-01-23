const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllFields() {
  try {
    const fields = await prisma.field.findMany({
      include: {
        client: true,
        manager: true,
        groups: {
          include: {
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
        },
        harvests: {
          include: {
            entries: true
          }
        }
      }
    });

    if (fields.length === 0) {
      console.log("No fields found in the database");
      return;
    }

    const totalGroups = fields.reduce((sum, f) => sum + f.groups.length, 0);
    const totalHarvests = fields.reduce((sum, f) => sum + f.harvests.length, 0);
    const totalEntries = fields.reduce((sum, f) => 
      sum + f.harvests.reduce((hSum, h) => hSum + h.entries.length, 0), 0);
    const totalGroupMembers = fields.reduce((sum, f) => 
      sum + f.groups.reduce((gSum, g) => gSum + g.members.length, 0), 0);
    const totalGroupLeaders = fields.reduce((sum, f) => 
      sum + f.groups.reduce((gSum, g) => 
        gSum + g.members.filter(m => m.isGroupLeader).length, 0), 0);

    console.log("\nFound fields:");
    console.log(`Total fields: ${fields.length}`);
    console.log("\nSummary:");
    console.log(`Total groups: ${totalGroups}`);
    console.log(`Total harvests: ${totalHarvests}`);
    console.log(`Total harvest entries: ${totalEntries}`);
    console.log(`Total group members: ${totalGroupMembers}`);
    console.log(`Total group leaders: ${totalGroupLeaders}`);

    const confirm = await question('\nAre you sure you want to delete ALL fields? This will:\n' +
      '- Delete ALL field records\n' +
      '- Delete ALL groups and their member associations\n' +
      '- Delete ALL harvests and harvest entries\n' +
      '- Delete group leader user accounts\n' +
      '- Remove field references from managers\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process each field in its own transaction
    for (const field of fields) {
      await prisma.$transaction(async (tx) => {
        // Delete harvest entries first
        await tx.harvestEntry.deleteMany({
          where: {
            harvest: {
              fieldId: field.id
            }
          }
        });

        // Delete harvests
        await tx.harvest.deleteMany({
          where: { fieldId: field.id }
        });

        // Handle group leaders and their user accounts
        const groupLeaderUserIds = field.groups
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

        // Delete group members
        await tx.groupMember.deleteMany({
          where: {
            group: {
              fieldId: field.id
            }
          }
        });

        // Delete groups
        await tx.group.deleteMany({
          where: { fieldId: field.id }
        });

        // Finally delete the field
        await tx.field.delete({
          where: { id: field.id }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      console.log(`Deleted field: ${field.name} (Client: ${field.client.name})`);
    }

    console.log("\nAll fields and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting fields:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllFields(); 