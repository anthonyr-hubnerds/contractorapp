import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a demo company
  const company = await prisma.company.create({
    data: {
      name: 'BuildSync Demo Corp',
      address: '123 Business Ave, Suite 100',
      phone: '(555) 123-4567',
      website: 'www.buildsyncdemo.com',
      taxId: '12-3456789',
      subscriptionTier: 'professional',
      users: {
        create: {
          email: 'admin@buildsync.com',
          name: 'Admin User',
          role: 'admin',
          hashedPassword: await bcrypt.hash('admin123', 10),
          twoFactorEnabled: true
        }
      }
    }
  });

  // Create subcontractors
  const johnSmith = await prisma.subcontractor.create({
    data: {
      name: 'John Smith Construction',
      companyId: company.id,
      email: 'john@smithconstruction.com',
      phone: '(555) 234-5678',
      address: '456 Builder Lane',
      taxId: '98-7654321',
      businessType: 'LLC',
      rating: 4.8,
      status: 'active',
      specialties: 'Carpentry,General Contracting',
      docs: {
        create: [{
          type: 'Insurance',
          fileUrl: 'https://example.com/insurance.pdf',
          status: 'verified',
          expiresAt: new Date('2026-12-31'),
          verificationDate: new Date(),
          metadata: JSON.stringify({
            insuranceType: 'General Liability',
            coverage: '$2,000,000'
          })
        },
        {
          type: 'License',
          fileUrl: 'https://example.com/license.pdf',
          status: 'verified',
          expiresAt: new Date('2026-06-30'),
          verificationDate: new Date(),
          metadata: JSON.stringify({
            licenseType: 'General Contractor',
            state: 'CA'
          })
        }]
      }
    }
  });

  await prisma.subcontractor.create({
    data: {
      name: 'Elite Electrical Services',
      companyId: company.id,
      email: 'info@eliteelectrical.com',
      phone: '(555) 345-6789',
      address: '789 Electric Ave',
      taxId: '45-6789123',
      businessType: 'Corporation',
      rating: 4.9,
      status: 'active',
      specialties: 'Electrical,Solar Installation',
      docs: {
        create: {
          type: 'License',
          fileUrl: 'https://example.com/electrical-license.pdf',
          status: 'verified',
          expiresAt: new Date('2026-06-30'),
          verificationDate: new Date(),
          metadata: JSON.stringify({
            licenseType: 'Master Electrician',
            state: 'CA'
          })
        }
      }
    }
  });

  // Create a project with time entries
  const project = await prisma.project.create({
    data: {
      name: 'Office Renovation Project',
      description: 'Complete renovation of 5000 sqft office space',
      status: 'active',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-03-31'),
      budget: 150000,
      location: '100 Main St, Suite 200',
      companyId: company.id,
      timeEntries: {
        create: {
          subcontractorId: johnSmith.id,
          start: new Date('2025-10-27T09:00:00Z'),
          end: new Date('2025-10-27T17:00:00Z'),
          hours: 8,
          hourlyRate: 75,
          description: 'Initial demolition work',
          status: 'approved',
          approvedAt: new Date()
        }
      }
    }
  });

  // Create an invoice
  await prisma.invoice.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      subcontractorId: johnSmith.id,
      number: 'INV-2025-001',
      amount: 600, // 8 hours * $75
      status: 'sent',
      dueDate: new Date('2025-11-26'),
      notes: 'Invoice for demolition work',
      payments: {
        create: {
          amount: 600,
          method: 'credit_card',
          status: 'completed',
          transactionId: 'txn_123456',
          processorFee: 17.70,
          metadata: JSON.stringify({
            cardLast4: '4242',
            cardBrand: 'Visa'
          })
        }
      }
    }
  });

  // Create a marketing template
  await prisma.marketingTemplate.create({
    data: {
      companyId: company.id,
      name: 'Project Update Template',
      type: 'email',
      subject: 'Project Update: {{projectName}}',
      content: 'Dear {{clientName}},\n\nYour project {{projectName}} is {{percentage}}% complete.\n\nBest regards,\nBuildSync Team',
      variables: 'projectName,clientName,percentage'
    }
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });