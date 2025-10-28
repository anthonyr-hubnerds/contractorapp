import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../src/index';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure a clean DB state for tests. Turn off foreign key checks during cleanup (SQLite)
  try {
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");
  } catch (e) {
    // ignore if not supported
  }

  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.complianceDocument.deleteMany();
  await prisma.timeEntry.deleteMany().catch(() => {});
  await prisma.payment.deleteMany().catch(() => {});
  await prisma.invoice.deleteMany().catch(() => {});
  await prisma.project.deleteMany().catch(() => {});
  await prisma.subcontractor.deleteMany();
  await prisma.user.deleteMany().catch(() => {});
  await prisma.company.deleteMany();

  try {
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
  } catch (e) {
    // ignore
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Documents API', () => {
  let companyId: string;
  let subcontractorId: string;
  let documentId: string;

  test('setup company and subcontractor', async () => {
    const company = await prisma.company.create({ data: { name: 'Test Co' } });
    companyId = company.id;
  const sub = await prisma.subcontractor.create({ data: { name: 'Test Sub', companyId, specialties: 'General' } });
    subcontractorId = sub.id;
    expect(companyId).toBeTruthy();
    expect(subcontractorId).toBeTruthy();
  });

  test('POST /api/documents - create document', async () => {
    const payload = {
      subcontractorId,
      type: 'insurance',
      fileUrl: 'https://example.com/test.pdf',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    };

    const res = await request(app).post('/api/documents').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.type).toBe('insurance');
    documentId = res.body.id;
  });

  test('PUT /api/documents/:id - update (verify) document', async () => {
    const res = await request(app).put(`/api/documents/${documentId}`).send({ status: 'verified', verifiedBy: 'tester' });
    // This endpoint updates type/fileUrl/status/expiresAt; verify status changed
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', documentId);
    expect(res.body.status).toBe('verified');
  });

  test('DELETE /api/documents/:id - delete document', async () => {
    const res = await request(app).delete(`/api/documents/${documentId}`);
    expect(res.status).toBe(204);
    const doc = await prisma.complianceDocument.findUnique({ where: { id: documentId } });
    expect(doc).toBeNull();
  });
});
