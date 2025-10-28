interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  // For development, just log the email
  if (process.env.NODE_ENV === 'development') {
    // Use logger so we don't trigger eslint no-console everywhere
    const { logger } = await import('../utils/logger');
    logger.info('=====================================');
    logger.info('Email Notification');
    logger.info('To:', to);
    logger.info('Subject:', subject);
    logger.info('Body:', html);
    logger.info('=====================================');
    return;
  }

  // TODO: Implement real email sending using your preferred email service
  // Example with AWS SES:
  // const ses = new AWS.SES({ region: process.env.AWS_REGION });
  // await ses.sendEmail({
  //   Source: 'notifications@buildsync.com',
  //   Destination: { ToAddresses: [to] },
  //   Message: {
  //     Subject: { Data: subject },
  //     Body: { Html: { Data: html } }
  //   }
  // }).promise();
}
