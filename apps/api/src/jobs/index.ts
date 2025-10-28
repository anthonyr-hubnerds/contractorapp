import { documentExpirationJob } from './documentExpiration';

export function startCronJobs() {
  console.log('Starting cron jobs...');
  documentExpirationJob.start();
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Stopping cron jobs...');
  documentExpirationJob.stop();
});
