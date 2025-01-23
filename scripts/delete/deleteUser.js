const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: {
          include: {
            fields: true,
            client: true
          }
        },
        worker: {
          include: {
            groups: {
              include: {
                group: true
              }
            },
            harvestEntries: true,
            clientHistory: true
          }
        },
        organization: true
      }
    });

    if (users.length === 0) {
      console.log("No users found in the database");
      return;
    }

    const totalManagers = users.filter(u => u.manager).length;
    const totalWorkers = users.filter(u => u.worker).length;
    const totalGroupLeaders = users.filter(u => 
      u.worker?.groups.some(g => g.isGroupLeader)).length;
    const totalFieldsManaged = users.reduce((sum, u) => 
      sum + (u.manager?.fields.length || 0), 0);
    const totalHarvestEntries = users.reduce((sum, u) => 
      sum + (u.worker?.harvestEntries.length || 0), 0);

    console.log("\nFound users:");
    console.log(`Total users: ${users.length}`);
    console.log("\nSummary:");
    console.log(`Field managers: ${totalManagers}`);
    console.log(`Workers: ${totalWorkers}`);
    console.log(`Group leaders: ${totalGroupLeaders}`);
    console.log(`Total fields managed: ${totalFieldsManaged}`);
    console.log(`Total harvest entries: ${totalHarvestEntries}`);

    const confirm = await question('\nAre you sure you want to delete ALL users? This will:\n' +
      '- Delete ALL user accounts\n' +
      '- Remove manager roles and unassign managed fields\n' +
      '- Remove group leader statuses\n' +
      '- Unlink workers from their user accounts\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process each user in its own transaction
    for (const user of users) {
      await prisma.$transaction(async (tx) => {
        if (user.manager) {
          // Update fields to remove manager reference
          await tx.field.updateMany({
            where: { managerId: user.manager.id },
            data: { managerId: null }
          });

          // Delete manager record
          await tx.manager.delete({
            where: { id: user.manager.id }
          });
        }

        if (user.worker) {
          // Remove group leader status if applicable
          const leaderGroups = user.worker.groups.filter(g => g.isGroupLeader);
          for (const membership of leaderGroups) {
            await tx.groupMember.update({
              where: { id: membership.id },
              data: { isGroupLeader: false }
            });
          }

          // Unlink worker from user
          await tx.worker.update({
            where: { id: user.worker.id },
            data: { userId: null }
          });
        }

        // Delete the user
        await tx.user.delete({
          where: { id: user.id }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      console.log(`Deleted user: ${user.name} (${user.email})`);
    }

    console.log("\nAll users and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting users:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllUsers(); 