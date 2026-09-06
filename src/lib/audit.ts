import { prisma } from './db';

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, any> | string
) {
  try {
    const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;
    return await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: detailsString,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}

