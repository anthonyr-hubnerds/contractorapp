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

describe('Document upload edge cases', () => {
  let companyId: string;
  let subcontractorId: string;

  test('create company and subcontractor', async () => {
    const company = await prisma.company.create({ data: { name: 'Edge Co' } });
    companyId = company.id;
    const sub = await prisma.subcontractor.create({ data: { name: 'Edge Sub', companyId, specialties: 'Edge' } });
    subcontractorId = sub.id;
    expect(companyId).toBeTruthy();
    expect(subcontractorId).toBeTruthy();
  });

  test('reject invalid file type (txt)', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.txt');
    const res = await request(app)
      .post(`/api/subcontractors/${subcontractorId}/documents`)
      .field('type', 'insurance')
      .attach('file', filePath);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('reject expired expiration date', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.pdf');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post(`/api/subcontractors/${subcontractorId}/documents`)
      .field('type', 'insurance')
      .field('expiresAt', yesterday)
      .attach('file', filePath);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
