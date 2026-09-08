import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PaymentStatus, PaymentType } from '@prisma/client';

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const paymentType = searchParams.get('paymentType')?.trim();
    const status = searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { razorpayOrderId: { contains: search, mode: 'insensitive' } },
        { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (paymentType && Object.values(PaymentType).includes(paymentType as PaymentType)) {
      where.paymentType = paymentType as PaymentType;
    }

    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.status = status as PaymentStatus;
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          paymentNumber: true,
          paymentType: true,
          amount: true,
          currency: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          status: true,
          paymentMethod: true,
          errorReason: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              customerProfile: { select: { name: true } },
              companionProfile: { select: { displayName: true } },
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              totalAmount: true,
              commissionAmount: true,
              status: true,
            },
          },
          refunds: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
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

