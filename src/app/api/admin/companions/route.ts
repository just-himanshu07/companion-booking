import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { Prisma, VerificationStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: Prisma.CompanionProfileWhereInput = {};

    if (status && Object.values(VerificationStatus).includes(status as VerificationStatus)) {
      where.verificationStatus = status as VerificationStatus;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const startTime = performance.now();

    const [companions, total] = await Promise.all([
      prisma.companionProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          username: true,
          fullName: true,
          displayName: true,
          age: true,
          gender: true,
          profilePhoto: true,
          gallery: true,
          hourlyPrice: true,
          bio: true,
          verificationStatus: true,
          verificationReason: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
          verificationDocs: {
            select: {
              id: true,
              documentType: true,
              fileUrl: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companionProfile.count({ where }),
    ]);

    const queryDurationMs = Math.round(performance.now() - startTime);
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        success: true,
        companions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        queryDurationMs,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
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

