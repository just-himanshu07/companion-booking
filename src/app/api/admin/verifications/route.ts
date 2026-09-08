import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await requireRole(['ADMIN']);

    const [
      emailVerificationStats,
      pendingCompanionProfiles,
      pendingVerificationDocs,
    ] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { isEmailVerified: false },
            { emailVerificationAttempts: { gt: 0 } },
            { accountStatus: 'PENDING' },
          ],
        },
        select: {
          id: true,
          email: true,
          role: true,
          accountStatus: true,
          isEmailVerified: true,
          isRegistrationFeePaid: true,
          emailVerificationAttempts: true,
          emailVerificationLastSentAt: true,
          emailVerificationOtpExpiresAt: true,
          createdAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.companionProfile.findMany({
        where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
        include: {
          user: { select: { email: true, createdAt: true } },
          city: true,
          verificationDocs: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.verificationDocument.findMany({
        where: { status: 'PENDING' },
        include: {
          companion: {
            select: {
              id: true,
              displayName: true,
              username: true,
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Sanitize stats: Exclude secrets completely
    const sanitizedEmailStats = emailVerificationStats.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      accountStatus: u.accountStatus,
      isEmailVerified: u.isEmailVerified,
      isRegistrationFeePaid: u.isRegistrationFeePaid,
      attemptsCount: u.emailVerificationAttempts,
      lastSentAt: u.emailVerificationLastSentAt,
      isExpired: u.emailVerificationOtpExpiresAt ? new Date() > new Date(u.emailVerificationOtpExpiresAt) : true,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      verifications: {
        emailOtpStats: sanitizedEmailStats,
        pendingCompanions: pendingCompanionProfiles,
        pendingDocuments: pendingVerificationDocs,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

