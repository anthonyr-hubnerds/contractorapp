// Entry point for initializing cron jobs and starting the server
import dotenv from 'dotenv';
import { startCronJobs } from './jobs';
import { logger } from './utils/logger';
import { app } from './index';

dotenv.config();

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  logger.info(`API listening on port ${port}`);
  startCronJobs();
  logger.info('Started cron jobs');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
