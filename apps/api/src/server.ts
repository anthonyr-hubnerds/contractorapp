// Entry point for initializing cron jobs and starting the server
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { startCronJobs } from './jobs';
import { logger } from './utils/logger';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
);
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Import and use other routes here
// ...

const port = process.env.PORT || 4000;
app.listen(port, () => {
  logger.info(`API listening on port ${port}`);
  startCronJobs();
  logger.info('Started cron jobs');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
