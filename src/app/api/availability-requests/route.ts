import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await requireRole(['CUSTOMER', 'COMPANION', 'ADMIN']);
    const { searchParams } = new URL(req.url);

    const statusFilter = searchParams.get('status')?.trim();
    const companionId = searchParams.get('companionId')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Auto-expire past pending requests
    const now = new Date();
    await prisma.availabilityRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    const where: any = {};

    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;
    } else if (user.role === 'COMPANION') {
      const companionProfile = await prisma.companionProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!companionProfile) {
        return NextResponse.json({ requests: [], pagination: { page: 1, limit, totalCount: 0, totalPages: 0 } });
      }
      where.companionId = companionProfile.id;
    } else if (user.role === 'ADMIN' && companionId) {
      where.companionId = companionId;
    }

    if (statusFilter && ['PENDING', 'ACCEPTED', 'DECLINED', 'COUNTER_PROPOSED', 'EXPIRED', 'CANCELLED', 'BOOKED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [requests, totalCount] = await Promise.all([
      prisma.availabilityRequest.findMany({
        where,
        include: {
          companion: {
            select: {
              id: true,
              displayName: true,
              username: true,
              profilePhoto: true,
              hourlyPrice: true,
              city: { select: { name: true } },
            },
          },
          customer: {
            select: {
              id: true,
              email: true,
              customerProfile: {
                select: {
                  name: true,
                  displayAvatar: true,
                  city: true,
                },
              },
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              conversation: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.availabilityRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

