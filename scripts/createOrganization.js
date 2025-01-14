const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createOrganization() {
  try {
    const existingOrg = await prisma.organization.findFirst();

    if (existingOrg) {
      console.log('\nAn organization already exists in the system:');
      console.log(JSON.stringify(existingOrg, null, 2));
      
      const choice = await question('\nWould you like to delete the existing organization and create a new one? (yes/no): ');
      
      if (choice.toLowerCase() !== 'yes') {
        console.log('Script ended. No changes were made.');
        return;
      }

      await prisma.organization.deleteMany();
      console.log('Existing organization deleted.');
    }

    const name = await question('Enter organization name: ');
    const email = await question('Enter organization email: ');
    const phone = await question('Enter organization phone (press Enter to skip): ');
    const address = await question('Enter organization address (press Enter to skip): ');
    const city = await question('Enter organization city (press Enter to skip): ');
    const zip = await question('Enter organization zip code (press Enter to skip): ');
    const internalOrganizationId = await question('Enter internal organization ID (press Enter to skip): ');

    const organization = await prisma.organization.create({
      data: {
        name,
        email,
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(zip && { zip }),
        ...(internalOrganizationId && { internalOrganizationId })
      }
    });

    console.log('\nOrganization created successfully:');
    console.log(JSON.stringify(organization, null, 2));

  } catch (error) {
    console.error('Error creating organization:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createOrganization(); 