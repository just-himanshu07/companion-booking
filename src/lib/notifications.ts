import { prisma } from './db';

export type NotificationType = 'SYSTEM' | 'BOOKING' | 'PAYMENT' | 'VERIFICATION' | 'CHAT' | 'REVIEW';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'SYSTEM',
  link?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });

    // Extensible email notification hook (Modular for SMS/Email providers like SendGrid / Twilio)
    dispatchExternalNotification(userId, title, message);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

function dispatchExternalNotification(userId: string, title: string, message: string) {
  // In production, integrate SendGrid, AWS SES, or Twilio SMS here.
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EXTERNAL NOTIFICATION HOOK] To User: ${userId} | Title: ${title} | Message: ${message}`);
  }
}

