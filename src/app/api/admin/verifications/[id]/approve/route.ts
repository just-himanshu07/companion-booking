import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole(['ADMIN']);
    const verificationId = params.id;

    if (!verificationId) {
      return NextResponse.json({ error: 'Verification ID parameter required' }, { status: 400 });
    }

    const verification = await prisma.identityVerification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Identity verification record not found' }, { status: 404 });
    }

    // Atomic transaction: update verification to APPROVED & user accountStatus to ACTIVE
    await prisma.$transaction(async (tx) => {
      await tx.identityVerification.update({
        where: { id: verificationId },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: verification.userId },
        data: {
          accountStatus: 'ACTIVE',
        },
      });
    });

    // Notify user of account approval
    await createNotification(
      verification.userId,
      'Identity Verification Approved! 🎉',
      'Your identity verification has been approved by our safety team. You now have full access to Paireva marketplace features.',
      'SYSTEM',
      '/dashboard'
    );

    return NextResponse.json({
      success: true,
      message: 'Identity verification approved successfully. Customer account is now ACTIVE.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to approve verification' }, { status: 500 });
  }
}

