import { documentExpirationJob } from './documentExpiration';
import { logger } from '../utils/logger';

export function startCronJobs() {
  logger.info('Starting cron jobs...');
  documentExpirationJob.start();
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Stopping cron jobs...');
  documentExpirationJob.stop();
});
