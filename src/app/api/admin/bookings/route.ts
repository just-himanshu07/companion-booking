import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BookingStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { companion: { username: { contains: search, mode: 'insensitive' } } },
        { companion: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus;
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              phone: true,
              customerProfile: { select: { name: true } },
            },
          },
          companion: {
            select: {
              id: true,
              username: true,
              displayName: true,
              fullName: true,
              city: { select: { name: true } },
              user: { select: { email: true } },
            },
          },
          activity: true,
          payment: {
            select: {
              id: true,
              paymentNumber: true,
              status: true,
              razorpayPaymentId: true,
              razorpayOrderId: true,
            },
          },
          refund: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
