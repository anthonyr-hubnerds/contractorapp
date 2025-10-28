import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import documentsRouter from './routes/documents';
import { logger } from './utils/logger';

dotenv.config();

// Debug helpers: log any uncaught exceptions/rejections during tests to aid debugging
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && (err.stack || err.message || err));
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const prisma = new PrismaClient();

const app = express();
app.use(
  cors({
    origin: 'http://localhost:3000', // Allow requests from Next.js frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
);
app.use(express.json());

// Mount documents router which handles S3 uploads for subcontractors
app.use('/api/subcontractors', documentsRouter);

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// List companies with all relations
app.get('/api/companies', async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: true,
        projects: {
          include: {
            timeEntries: {
              include: {
                subcontractor: true
              }
            }
          }
        },
        subcontractors: {
          include: {
            docs: true,
            timeEntries: true
          }
        }
      }
    });
    return res.json(companies);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// --- Companies CRUD ---
app.get('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: true,
        projects: { include: { timeEntries: { include: { subcontractor: true } } } },
        subcontractors: { include: { docs: true, timeEntries: true } }
      }
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    return res.json(company);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
});

app.post('/api/companies', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const company = await prisma.company.create({ data: { name } });
    return res.status(201).json(company);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to create company' });
  }
});

app.put('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: { name }
    });
    return res.json(updated);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to delete company' });
  }
});

// --- Projects CRUD ---
app.get('/api/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: { timeEntries: { include: { subcontractor: true } }, company: true }
    });
    return res.json(projects);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { timeEntries: { include: { subcontractor: true } }, company: true }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const { name, budget, companyId } = req.body;
    if (!name || !companyId)
      return res.status(400).json({ error: 'Name and companyId are required' });
    const project = await prisma.project.create({
      data: { name, budget: budget ?? null, companyId }
    });
    return res.status(201).json(project);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const { name, budget } = req.body;
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, budget }
    });
    return res.json(updated);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// --- Subcontractors CRUD ---
app.get('/api/subcontractors', async (_req: Request, res: Response) => {
  try {
    const subs = await prisma.subcontractor.findMany({
      include: { docs: true, timeEntries: true, company: true }
    });
    return res.json(subs);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch subcontractors' });
  }
});

app.get('/api/subcontractors/:id', async (req: Request, res: Response) => {
  try {
    const sub = await prisma.subcontractor.findUnique({
      where: { id: req.params.id },
      include: { docs: true, timeEntries: true, company: true }
    });
    if (!sub) return res.status(404).json({ error: 'Subcontractor not found' });
    return res.json(sub);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch subcontractor' });
  }
});

app.post('/api/subcontractors', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      companyId,
      address,
      taxId,
      businessType,
      rating,
      status,
      specialties
    } = req.body;

    if (!name || !companyId) {
      return res.status(400).json({ error: 'Name and companyId are required' });
    }

    const sub = await prisma.subcontractor.create({
      data: {
        name,
        email,
        phone,
        companyId,
        address,
        taxId,
        businessType,
        rating: rating ? parseFloat(rating) : null,
        status: status || 'active',
        specialties: specialties || []
      }
    });

    return res.status(201).json(sub);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to create subcontractor' });
  }
});

app.put('/api/subcontractors/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, taxId, businessType, rating, status, specialties } =
      req.body;

    const updated = await prisma.subcontractor.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        phone,
        address,
        taxId,
        businessType,
        rating: rating ? parseFloat(rating) : null,
        status,
        specialties
      }
    });
    return res.json(updated);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to update subcontractor' });
  }
});

app.delete('/api/subcontractors/:id', async (req: Request, res: Response) => {
  try {
    await prisma.subcontractor.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to delete subcontractor' });
  }
});

// --- TimeEntries CRUD ---
app.get('/api/time-entries', async (_req: Request, res: Response) => {
  try {
    const entries = await prisma.timeEntry.findMany({
      include: { project: true, subcontractor: true }
    });
    return res.json(entries);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

app.get('/api/time-entries/:id', async (req: Request, res: Response) => {
  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: { project: true, subcontractor: true }
    });
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });
    return res.json(entry);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch time entry' });
  }
});

app.post('/api/time-entries', async (req: Request, res: Response) => {
  try {
    const { projectId, subcontractorId, start, end, hours, status } = req.body;
    if (!projectId || !subcontractorId || !start || !end)
      return res.status(400).json({ error: 'Missing required fields' });
    const entry = await prisma.timeEntry.create({
      data: {
        projectId,
        subcontractorId,
        start: new Date(start),
        end: new Date(end),
        hours: hours ?? 0,
        status: status ?? 'submitted'
      }
    });
    return res.status(201).json(entry);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to create time entry' });
  }
});

app.put('/api/time-entries/:id', async (req: Request, res: Response) => {
  try {
    const { start, end, hours, status } = req.body;
    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        hours,
        status
      }
    });
    return res.json(updated);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to update time entry' });
  }
});

app.delete('/api/time-entries/:id', async (req: Request, res: Response) => {
  try {
    await prisma.timeEntry.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// --- Compliance Documents CRUD ---
app.get('/api/documents', async (_req: Request, res: Response) => {
  try {
    const docs = await prisma.complianceDocument.findMany({ include: { subcontractor: true } });
    return res.json(docs);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

app.get('/api/documents/:id', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.complianceDocument.findUnique({
      where: { id: req.params.id },
      include: { subcontractor: true }
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    return res.json(doc);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

app.post('/api/documents', async (req: Request, res: Response) => {
  try {
    const { subcontractorId, type, fileUrl, status, expiresAt } = req.body;
    if (!subcontractorId || !type || !fileUrl)
      return res.status(400).json({ error: 'Missing required fields' });
    const doc = await prisma.complianceDocument.create({
      data: {
        subcontractorId,
        type,
        fileUrl,
        status: status ?? 'pending',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });
    return res.status(201).json(doc);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to create document' });
  }
});

app.put('/api/documents/:id', async (req: Request, res: Response) => {
  try {
    const { type, fileUrl, status, expiresAt } = req.body;
    const updated = await prisma.complianceDocument.update({
      where: { id: req.params.id },
      data: { type, fileUrl, status, expiresAt: expiresAt ? new Date(expiresAt) : undefined }
    });
    return res.json(updated);
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

app.delete('/api/documents/:id', async (req: Request, res: Response) => {
  try {
    await prisma.complianceDocument.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Support frontend verification endpoint used by SubcontractorCard
app.post('/api/documents/:id/verify', async (req: Request, res: Response) => {
  try {
    const { status, verifiedBy } = req.body;

    if (!status || !verifiedBy) {
      return res
        .status(400)
        .json({ error: 'Missing required fields', required: ['status', 'verifiedBy'] });
    }

    const validStatuses = ['approved', 'rejected', 'pending_revision', 'verified'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const existingDocument = await prisma.complianceDocument.findUnique({
      where: { id: req.params.id }
    });
    if (!existingDocument) return res.status(404).json({ error: 'Document not found' });

    if (existingDocument.expiresAt && existingDocument.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Cannot verify expired document',
        expirationDate: existingDocument.expiresAt
      });
    }

    const updated = await prisma.complianceDocument.update({
      where: { id: req.params.id },
      data: {
        status,
        verificationDate: new Date(),
        verifiedBy,
        metadata: existingDocument.metadata
      }
    });
    return res.json({ message: 'Document verified successfully', document: updated });
  } catch (err) {
     logger.error(err);
    return res.status(500).json({ error: 'Failed to verify document' });
  }
});

const port = process.env.PORT || 4000;

// Export the app for tests to import without starting the server.
export { app };

// Start the server only when run directly (not when imported by tests)
if (require.main === module) {
  app.listen(port, () => {
     logger.info(`API listening on port ${port}`);
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
