// This test verifies that when DB save fails after a successful S3 upload, the code attempts to delete the uploaded S3 object.
// We set NODE_ENV=production before importing the app so multerS3 is used. We mock S3Client using aws-sdk-client-mock.

(process as any).env.NODE_ENV = 'production';
(process as any).env.AWS_S3_BUCKET = 'test-bucket';

const request = require('supertest');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { mockClient } = require('aws-sdk-client-mock');
const { S3Client } = require('@aws-sdk/client-s3');

// Import app after setting NODE_ENV
const { app } = require('../src/index');
const { documentsPrisma } = require('../src/routes/documents');

const prisma = new PrismaClient();
const s3Mock = mockClient(S3Client);

beforeAll(async () => {
  s3Mock.reset();
  // Ensure PutObject (invoked by multer-s3) and DeleteObject succeed
  const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
  s3Mock.on(PutObjectCommand).resolves({});
  s3Mock.on(DeleteObjectCommand).resolves({});

  try { await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;"); } catch (e) {}
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.complianceDocument.deleteMany().catch(() => {});
  await prisma.subcontractor.deleteMany().catch(() => {});
  await prisma.company.deleteMany().catch(() => {});
  try { await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;"); } catch (e) {}
});

afterAll(async () => {
  await prisma.$disconnect();
  s3Mock.restore();
});

describe('S3 cleanup on DB failure', () => {
  test('uploads then DB fails -> S3 DeleteObjectCommand is called', async () => {
    const company = await prisma.company.create({ data: { name: 'S3Fail Co' } });
    const sub = await prisma.subcontractor.create({ data: { name: 'S3Fail Sub', companyId: company.id, specialties: 'Test' } });

    // Make the documentsPrisma create throw to simulate DB failure
    const spy = jest.spyOn(documentsPrisma.complianceDocument, 'create').mockImplementation(() => {
      throw new Error('Simulated DB failure');
    });

    const filePath = path.join(__dirname, 'fixtures', 'test.pdf');

    const res = await request(app)
      .post(`/api/subcontractors/${sub.id}/documents`)
      .field('type', 'insurance')
      .attach('file', filePath);

    // Expect server responded with 500 due to DB failure
    expect(res.status).toBe(500);

    // Verify that DeleteObjectCommand was sent to S3 mock at least once
  // aws-sdk-client-mock provides command-specific call helpers
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const deleteCalls = s3Mock.commandCalls(DeleteObjectCommand);
  expect(deleteCalls.length).toBeGreaterThanOrEqual(1);

    spy.mockRestore();
  });
});
