import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FeedbackStatus } from '@prisma/client';

export async function PATCH(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { feedbackId, status } = await req.json();

    if (!feedbackId || !status) {
      return NextResponse.json({ error: 'Feedback ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid feedback status' }, { status: 400 });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: status as FeedbackStatus },
    });

    // Log admin audit
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_FEEDBACK_STATUS',
        targetType: 'Feedback',
        targetId: feedbackId,
        details: `Updated feedback status to ${status}`,
      },
    });

    return NextResponse.json({ success: true, feedback: updatedFeedback });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

