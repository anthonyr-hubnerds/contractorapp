import { CronJob } from 'cron';
import { checkExpiringDocuments } from '../services/notifications';
import { logger } from '../utils/logger';

// Run notification check every day at midnight
export const documentExpirationJob = new CronJob('0 0 * * *', async () => {
  logger.info('Running document expiration check...');
  try {
    const notifications = await checkExpiringDocuments();
    logger.info(`Sent ${notifications.length} expiration notifications`);
  } catch (error) {
    logger.error('Error checking document expirations:', error);
  }
});
