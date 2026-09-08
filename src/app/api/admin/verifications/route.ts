import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
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
        select: {
          id: true,
          fullName: true,
          displayName: true,
          username: true,
          verificationStatus: true,
          createdAt: true,
          user: { select: { email: true, createdAt: true } },
          city: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.verificationDocument.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          documentType: true,
          fileUrl: true,
          status: true,
          createdAt: true,
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
        take: 50,
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

    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        verifications: {
          emailOtpStats: sanitizedEmailStats,
          pendingCompanions: pendingCompanionProfiles,
          pendingDocuments: pendingVerificationDocs,
        },
        queryDurationMs: duration,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
