import { prisma } from '../db';
import { sendEmail } from './email';
import { formatDistanceToNow } from 'date-fns';



interface DocumentNotification {
  id: string;
  type: string;
  subcontractorName: string;
  subcontractorEmail: string;
  companyName: string;
  expiresAt: Date;
  fileUrl: string;
}

export async function checkExpiringDocuments() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const today = new Date();

  // Find documents that are expiring soon
  const expiringDocuments = await prisma.complianceDocument.findMany({
    where: {
      AND: [
        { expiresAt: { not: null } },
        { expiresAt: { lte: thirtyDaysFromNow } },
        {
          status: {
            not: 'expired'
          }
        }
      ]
    },
    include: {
      subcontractor: {
        include: {
          company: true
        }
      }
    }
  });

  const notifications: DocumentNotification[] = [];

  for (const doc of expiringDocuments) {
    if (!doc.expiresAt) continue;

    const expiresAt = new Date(doc.expiresAt);
    const daysUntilExpiration = Math.ceil(
      (expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check different expiration thresholds
    if (
      (daysUntilExpiration <= 30 && daysUntilExpiration > 7) ||
      (daysUntilExpiration <= 7 && daysUntilExpiration > 0) ||
      daysUntilExpiration <= 0
    ) {
      notifications.push({
        id: doc.id,
        type: doc.type,
        subcontractorName: doc.subcontractor.name,
        subcontractorEmail: doc.subcontractor.email || '',
        companyName: doc.subcontractor.company.name,
        expiresAt: doc.expiresAt,
        fileUrl: doc.fileUrl
      });
    }

    // Update status to expired if past expiration date
    if (daysUntilExpiration <= 0) {
      await prisma.complianceDocument.update({
        where: { id: doc.id },
        data: { status: 'expired' }
      });
    }
  }

  // Send notifications for each document
  for (const doc of notifications) {
    if (!doc.subcontractorEmail) continue;

    const timeUntilExpiration = formatDistanceToNow(doc.expiresAt);

    // Send email notification
    await sendEmail({
      to: doc.subcontractorEmail,
      subject: `Document Expiration Notice - ${doc.type}`,
      html: `
        <h2>Document Expiration Notice</h2>
        <p>Hello ${doc.subcontractorName},</p>
        <p>This is a reminder that your ${doc.type} document for ${doc.companyName} will expire in ${timeUntilExpiration}.</p>
        <p>Please upload an updated document before the expiration date to maintain compliance.</p>
        <p>You can view the current document here: <a href="${doc.fileUrl}">View Document</a></p>
        <p>If you've already renewed this document, please upload the new version through the BuildSync portal.</p>
        <br>
        <p>Best regards,</p>
        <p>BuildSync Team</p>
      `
    });

    // Create notification record
    await prisma.notification.create({
      data: {
        type: 'document_expiring',
        title: `${doc.type} Expiring Soon`,
        message: `Your ${doc.type} will expire in ${timeUntilExpiration}`,
        status: 'unread',
        user: {
          connect: {
            email: doc.subcontractorEmail
          }
        }
      }
    });
  }

  return notifications;
}
