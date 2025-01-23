const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllManagers() {
  try {
    const managers = await prisma.manager.findMany({
      include: {
        client: true,
        fields: true,
        user: true
      }
    });

    if (managers.length === 0) {
      console.log("No managers found in the database");
      return;
    }

    console.log("\nFound managers:");
    console.log(`Total managers: ${managers.length}`);
    console.log("\nSummary:");
    console.log(`Total fields managed: ${managers.reduce((sum, m) => sum + m.fields.length, 0)}`);
    console.log(`Managers with user accounts: ${managers.filter(m => m.user).length}`);

    const confirm = await question('\nAre you sure you want to delete ALL managers? This will:\n' +
      '- Delete ALL manager records\n' +
      '- Unassign ALL managed fields\n' +
      '- Delete associated user accounts\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.field.updateMany({
        where: {
          managerId: {
            not: null
          }
        },
        data: { managerId: null }
      });

      const managerIds = managers.map(m => m.id);
      const userIds = managers.filter(m => m.userId).map(m => m.userId);

      if (userIds.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: {
              in: userIds
            }
          }
        });
      }

      await tx.manager.deleteMany({
        where: {
          id: {
            in: managerIds
          }
        }
      });
    });

    console.log("\nAll managers and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting managers:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllManagers(); 