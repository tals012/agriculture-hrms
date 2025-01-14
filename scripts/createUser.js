const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const readline = require('readline');

const saltRounds = 10;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createUser() {
  try {
    const username = await question('Enter username: ');
    
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log("User with the given username already exists");
      return;
    }

    const name = await question('Enter full name: ');
    const email = await question('Enter email: ');
    const phone = await question('Enter phone (press Enter to skip): ');
    const password = await question('Enter password: ');
    
    console.log('\nAvailable roles: ADMIN, FIELD_MANAGER, FOREIGN_WORKER');
    const role = await question('Enter role: ');

    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log("No organization exists. Please create an organization first.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        ...(phone && { phone }),
        role,
        organizationId: organization.id
      },
    });

    console.log("\nUser created successfully:");
    console.log(JSON.stringify(user, null, 2));

  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createUser();
