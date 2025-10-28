import { CronJob } from 'cron';
import { checkExpiringDocuments } from '../services/notifications';

// Run notification check every day at midnight
export const documentExpirationJob = new CronJob('0 0 * * *', async () => {
  console.log('Running document expiration check...');
  try {
    const notifications = await checkExpiringDocuments();
    console.log(`Sent ${notifications.length} expiration notifications`);
  } catch (error) {
    console.error('Error checking document expirations:', error);
  }
});
