import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export { prisma as documentsPrisma };
const router = Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const isTestEnv = process.env.NODE_ENV === 'test';
let upload: multer.Multer;
if (isTestEnv) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      if (allowedMimes.includes(file.mimetype)) return cb(null, true);
      // Don't throw — mark the request so we can respond gracefully in the route handler
      (req as any).fileValidationError = 'Invalid file type. Only PDF, JPEG, PNG, and GIF files are allowed.';
      return cb(null, false);
    }
  });
} else {
  upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET || 'buildsync-documents',
      metadata: (_req, file, cb) => cb(null, { fieldName: file.fieldname }),
      key: (_req, file, cb) => cb(null, `documents/${Date.now()}-${file.originalname}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      if (allowedMimes.includes(file.mimetype)) return cb(null, true);
      (req as any).fileValidationError = 'Invalid file type. Only PDF, JPEG, PNG, and GIF files are allowed.';
      return cb(null, false);
    },
  });
}

// Upload
router.post('/:subcontractorId/documents', async (req: Request, res: Response) => {
  const { subcontractorId } = req.params;
  if (process.env.NODE_ENV === 'test') console.log('[test] POST /:subcontractorId/documents start', { subcontractorId });

  await new Promise<void>((resolve) => {
    upload.single('file')(req, res, async (err: any) => {
      if (process.env.NODE_ENV === 'test') console.log('[test] multer callback invoked, err=', err && err.message);
      if (err) {
        if (process.env.NODE_ENV === 'test') console.log('[test] multer error -> responding 400', err.message);
        res.status(400).json({ error: err.message });
        return resolve();
      }

      const { type, expiresAt } = req.body as { type?: string; expiresAt?: string };
      const validTypes = ['insurance', 'license', 'certification', 'contract', 'other'];
      if (!type || !validTypes.includes(type)) {
        res.status(400).json({ error: 'Invalid document type', validTypes });
        return resolve();
      }

      if (expiresAt) {
        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime()) || expDate < new Date()) {
          res.status(400).json({ error: 'Invalid expiration date' });
          return resolve();
        }
      }

      const file = req.file as Express.MulterS3.File;
      if (!file) {
        // If fileFilter rejected the file, surface that error message to the client
        const fv = (req as any).fileValidationError;
        if (fv) {
          res.status(400).json({ error: fv });
          return resolve();
        }

        res.status(400).json({ error: 'No file uploaded' });
        return resolve();
      }

      try {
        const fileUrl = (file as any).location || `memory://${file.originalname}-${Date.now()}`;
        const metaObj: any = { originalName: file.originalname, size: file.size, mimeType: file.mimetype };
        if ((file as any).key) metaObj.key = (file as any).key;
        if ((file as any).bucket) metaObj.bucket = (file as any).bucket;

        const document = await prisma.complianceDocument.create({
          data: {
            type,
            fileUrl,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            status: 'pending',
            subcontractorId,
            metadata: JSON.stringify(metaObj),
          },
        });

        res.status(201).json({ message: 'Document uploaded successfully', document });
        return resolve();
      } catch (dbErr) {
        // attempt to cleanup S3 object if present
        try {
          const key = (req.file as any)?.key;
          const bucket = (req.file as any)?.bucket || process.env.AWS_S3_BUCKET;
          if (key && bucket) {
            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          }
        } catch (s3Err) {
          console.error('S3 cleanup failed', s3Err);
        }

        console.error('DB error', dbErr);
        res.status(500).json({ error: 'Failed to save document' });
        return resolve();
      }
    });
  });

  return;
});

// Delete
router.delete('/:subcontractorId/documents/:documentId', async (req: Request, res: Response) => {
  try {
    const { subcontractorId, documentId } = req.params;
    const document = await prisma.complianceDocument.findFirst({ where: { id: documentId, subcontractorId } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const existingMeta = (document.metadata as any) || {};
    const s3Key = existingMeta.key;
    if (s3Key) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET || 'buildsync-documents', Key: s3Key }));
      } catch (s3Err) {
        console.error('Failed to delete from S3:', s3Err);
        return res.status(500).json({ error: 'Failed to delete file from storage' });
      }
    }

    await prisma.complianceDocument.delete({ where: { id: documentId } });
    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Document deletion error:', err);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Verify
router.put('/:subcontractorId/documents/:documentId/verify', async (req: Request, res: Response) => {
  try {
    const { subcontractorId, documentId } = req.params;
    const { status, verifiedBy, verificationNotes } = req.body;
    if (!status || !verifiedBy) return res.status(400).json({ error: 'Missing required fields' });
    const validStatuses = ['approved', 'rejected', 'pending_revision'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const existingDocument = await prisma.complianceDocument.findFirst({ where: { id: documentId, subcontractorId } });
    if (!existingDocument) return res.status(404).json({ error: 'Document not found' });
    if (existingDocument.expiresAt && existingDocument.expiresAt < new Date()) return res.status(400).json({ error: 'Cannot verify expired document' });

    const existingMeta = (existingDocument.metadata as any) || {};
    const newVerificationEntry = { status, verifiedBy, date: new Date().toISOString(), notes: verificationNotes || null };
    const updatedMeta = { ...existingMeta, lastVerifiedAt: new Date().toISOString(), verificationHistory: [ ...(Array.isArray(existingMeta.verificationHistory) ? existingMeta.verificationHistory : []), newVerificationEntry ] };

    const document = await prisma.complianceDocument.update({ where: { id: documentId }, data: { status, verificationDate: new Date(), verifiedBy, metadata: updatedMeta as any } });
    return res.json({ message: 'Document verified successfully', document });
  } catch (err) {
    console.error('Document verification error:', err);
    return res.status(500).json({ error: 'Failed to verify document' });
  }
});

export default router;