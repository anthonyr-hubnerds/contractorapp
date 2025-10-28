const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const company = await prisma.company.create({
    data: {
      name: 'Demo Contractor Co',
      users: {
        create: [{ email: 'admin@demo.com', name: 'Admin User', role: 'admin' }]
      },
      projects: {
        create: [{ name: 'Demo Project', budget: 100000 }]
      }
    },
    include: { users: true, projects: true }
  });

  const subcontractor = await prisma.subcontractor.create({
    data: {
      companyId: company.id,
      name: 'Demo Subcontractor'
    }
  });

  await prisma.complianceDocument.create({
    data: {
      subcontractorId: subcontractor.id,
      type: 'insurance',
      fileUrl: 'https://example.com/dummy.pdf',
      status: 'verified'
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
