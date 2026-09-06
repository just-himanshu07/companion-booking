import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  try {
    await requireRole(['ADMIN']);

    const companions = await prisma.companionProfile.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
        city: true,
        verificationDocs: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ companions });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { companionId, verificationStatus, reason } = await req.json();

    if (!companionId || !verificationStatus) {
      return NextResponse.json({ error: 'Companion ID and verification status are required' }, { status: 400 });
    }

    const companion = await prisma.companionProfile.update({
      where: { id: companionId },
      data: {
        verificationStatus,
        verificationReason: reason,
      },
      include: { user: true },
    });

    await logAdminAction(
      admin.id,
      `UPDATE_COMPANION_STATUS_${verificationStatus}`,
      'COMPANION_PROFILE',
      companionId,
      { status: verificationStatus, reason }
    );

    await createNotification(
      companion.userId,
      `Companion Verification Status Updated`,
      `Your verification status has been set to ${verificationStatus}${reason ? `: ${reason}` : ''}.`,
      'VERIFICATION',
      '/companion-dashboard'
    );

    return NextResponse.json({ success: true, companion });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

