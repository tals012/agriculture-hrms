const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteManager() {
  try {
    const managerId = await question('Enter manager ID to delete: ');

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: {
        client: true,
        fields: true,
        user: true
      }
    });

    if (!manager) {
      console.log("Manager not found");
      return;
    }

    console.log("\nManager found:");
    console.log(`Name: ${manager.name}`);
    console.log(`Email: ${manager.email}`);
    console.log(`Phone: ${manager.phone}`);
    console.log(`Client: ${manager.client.name}`);
    console.log(`Fields Managed: ${manager.fields.length}`);
    console.log(`Has User Account: ${manager.user ? 'Yes' : 'No'}`);

    const confirm = await question('\nAre you sure you want to delete this manager? This will also:\n' +
      '- Unassign all managed fields\n' +
      (manager.user ? '- Delete associated user account\n' : '') +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.field.updateMany({
        where: { managerId },
        data: { managerId: null }
      });

      if (manager.userId) {
        await tx.user.delete({
          where: { id: manager.userId }
        });
      }

      await tx.manager.delete({
        where: { id: managerId }
      });
    });

    console.log("\nManager and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting manager:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteManager(); 