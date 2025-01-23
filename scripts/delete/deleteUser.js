const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteUser() {
  try {
    const userId = await question('Enter user ID to delete: ');

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
            }
          }
        }
      }
    });

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log("\nUser found:");
    console.log(`Name: ${user.name}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role || 'No role'}`);

    if (user.manager) {
      console.log('\nManager Information:');
      console.log(`Client: ${user.manager.client.name}`);
      console.log(`Fields Managed: ${user.manager.fields.length}`);
    }
    if (user.worker) {
      console.log('\nWorker Information:');
      console.log(`Groups: ${user.worker.groups.length}`);
      const isGroupLeader = user.worker.groups.some(g => g.isGroupLeader);
      if (isGroupLeader) {
        console.log('Is a Group Leader in some groups');
      }
    }
    
    const confirm = await question('\nAre you sure you want to delete this user? This will also:\n' +
      (user.manager ? '- Remove manager role and unassign managed fields\n' : '') +
      (user.worker?.groups.some(g => g.isGroupLeader) ? '- Remove group leader status\n' : '') +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (user.manager) {
        await tx.field.updateMany({
          where: { managerId: user.manager.id },
          data: { managerId: null }
        });
        
        await tx.manager.delete({
          where: { id: user.manager.id }
        });
      }

      if (user.worker) {
        const leaderGroups = user.worker.groups.filter(g => g.isGroupLeader);
        for (const membership of leaderGroups) {
          await tx.groupMember.update({
            where: { id: membership.id },
            data: { isGroupLeader: false }
          });
        }
        
        await tx.worker.update({
          where: { id: user.worker.id },
          data: { userId: null }
        });
      }

      await tx.user.delete({
        where: { id: userId }
      });
    });

    console.log("\nUser and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting user:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteUser(); 