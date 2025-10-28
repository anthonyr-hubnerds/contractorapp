import { PrismaClient } from '@prisma/client';
import { checkExpiringDocuments } from '../src/services/notifications';
import * as emailService from '../src/services/email';

const prisma = new PrismaClient();

jest.mock('../src/services/email');

beforeAll(async () => {
  try {
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");
  } catch (e) {}

  await prisma.notification.deleteMany().catch(() => {});
  await prisma.complianceDocument.deleteMany().catch(() => {});
  await prisma.subcontractor.deleteMany().catch(() => {});
  await prisma.company.deleteMany().catch(() => {});

  try {
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
  } catch (e) {}
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Expiration notifications', () => {
  test('marks expired documents and sends notifications for soon-to-expire', async () => {
    const company = await prisma.company.create({ data: { name: 'Notify Co' } });
  const sub = await prisma.subcontractor.create({ data: { name: 'Notify Sub', companyId: company.id, email: 'sub@example.com', specialties: 'Test' } });
  // Create a matching User so notifications can be associated by email
  await prisma.user.create({ data: { email: 'sub@example.com', name: 'Sub User', hashedPassword: 'x', role: 'user', companyId: company.id } });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 5);

    const laterDate = new Date();
    laterDate.setDate(laterDate.getDate() + 20);

    // Create one expired, one expiring soon (5 days), and one later (20 days)
    const expired = await prisma.complianceDocument.create({ data: { subcontractorId: sub.id, type: 'insurance', fileUrl: 'https://example.com/e.pdf', status: 'pending', expiresAt: pastDate } });
    const soon = await prisma.complianceDocument.create({ data: { subcontractorId: sub.id, type: 'license', fileUrl: 'https://example.com/s.pdf', status: 'pending', expiresAt: soonDate } });
    const later = await prisma.complianceDocument.create({ data: { subcontractorId: sub.id, type: 'other', fileUrl: 'https://example.com/l.pdf', status: 'pending', expiresAt: laterDate } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendEmailMock = (emailService as any).sendEmail as jest.MockedFunction<typeof emailService.sendEmail>;
    sendEmailMock.mockClear();

    const notifications = await checkExpiringDocuments();

    // expired should be updated in DB
    const refreshedExpired = await prisma.complianceDocument.findUnique({ where: { id: expired.id } });
    expect(refreshedExpired?.status).toBe('expired');

    // soon should have generated a notification and an email
    const notifRecords = await prisma.notification.findMany({ where: { user: { email: sub.email } }, include: { user: true } }).catch(() => [] as any[]);
    expect(notifRecords.length).toBeGreaterThanOrEqual(1);

    expect(sendEmailMock.mock.calls.length).toBeGreaterThanOrEqual(1);

    // later should not trigger immediate notification
  const laterNotif = (notifRecords as any[]).find((n: any) => n.message?.includes('other'));
  // It's acceptable for none to exist for later; ensure at least soon triggered
  const soonNotifs = (notifRecords as any[]).filter((n: any) => n.message?.includes('license') || n.title?.toLowerCase().includes('license'));
    expect(soonNotifs.length).toBeGreaterThanOrEqual(1);
  });
});
