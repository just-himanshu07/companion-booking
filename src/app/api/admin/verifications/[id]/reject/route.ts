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
    const body = await req.json().catch(() => ({}));
    const { rejectionReason } = body;

    if (!verificationId) {
      return NextResponse.json({ error: 'Verification ID parameter required' }, { status: 400 });
    }

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 5) {
      return NextResponse.json(
        { error: 'A clear rejection reason (at least 5 characters) must be provided.' },
        { status: 400 }
      );
    }

    const verification = await prisma.identityVerification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Identity verification record not found' }, { status: 404 });
    }

    const reasonClean = rejectionReason.trim();

    // Atomic transaction: update verification to REJECTED & user accountStatus to REJECTED
    await prisma.$transaction(async (tx) => {
      await tx.identityVerification.update({
        where: { id: verificationId },
        data: {
          status: 'REJECTED',
          rejectionReason: reasonClean,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: verification.userId },
        data: {
          accountStatus: 'REJECTED',
        },
      });
    });

    // Notify user of account rejection with clear reason
    await createNotification(
      verification.userId,
      'Identity Verification Update',
      `Your identity verification request could not be approved. Reason: ${reasonClean}. You can submit fresh documents to re-verify.`,
      'SYSTEM',
      '/identity-verification'
    );

    return NextResponse.json({
      success: true,
      message: 'Identity verification rejected. Customer notified of rejection reason.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to reject verification' }, { status: 500 });
  }
}

