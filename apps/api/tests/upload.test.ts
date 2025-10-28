import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../src/index';
import path from 'path';

const prisma = new PrismaClient();

beforeAll(async () => {
  try { await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;"); } catch (e) {}
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.complianceDocument.deleteMany().catch(() => {});
  await prisma.subcontractor.deleteMany().catch(() => {});
  await prisma.company.deleteMany().catch(() => {});
  try { await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;"); } catch (e) {}
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Document upload API (memory storage in test)', () => {
  let companyId: string;
  let subcontractorId: string;

  test('create company and subcontractor', async () => {
    const company = await prisma.company.create({ data: { name: 'Upload Co' } });
    companyId = company.id;
    const sub = await prisma.subcontractor.create({ data: { name: 'Upload Sub', companyId, specialties: 'Test' } });
    subcontractorId = sub.id;
    expect(companyId).toBeTruthy();
    expect(subcontractorId).toBeTruthy();
  });

  test('POST upload file', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.pdf');
    const res = await request(app)
      .post(`/api/subcontractors/${subcontractorId}/documents`)
      .field('type', 'insurance')
      .attach('file', filePath);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('document');
    expect(res.body.document).toHaveProperty('id');
    const doc = await prisma.complianceDocument.findUnique({ where: { id: res.body.document.id } });
    expect(doc).not.toBeNull();
  });

  test('DELETE uploaded document', async () => {
    const docs = await prisma.complianceDocument.findMany({ where: { subcontractorId } });
    expect(docs.length).toBeGreaterThanOrEqual(1);
    const docId = docs[0].id;
    const res = await request(app).delete(`/api/subcontractors/${subcontractorId}/documents/${docId}`);
    expect(res.status).toBe(200);
    const doc = await prisma.complianceDocument.findUnique({ where: { id: docId } });
    expect(doc).toBeNull();
  });
});
