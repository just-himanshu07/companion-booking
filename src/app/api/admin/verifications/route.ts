import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { searchParams } = new URL(req.url);

    const statusFilter = searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusFilter && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [verifications, totalCount] = await Promise.all([
      prisma.identityVerification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              accountStatus: true,
              isRegistrationFeePaid: true,
              isEmailVerified: true,
              createdAt: true,
              customerProfile: {
                select: {
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.identityVerification.count({ where }),
    ]);

    return NextResponse.json({
      verifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to list verifications' }, { status: 500 });
  }
}
