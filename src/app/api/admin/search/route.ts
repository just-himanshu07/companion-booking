import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({
        users: [],
        companions: [],
        bookings: [],
        payments: [],
        reports: [],
      });
    }

    const [users, companions, bookings, payments, reports] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
            { customerProfile: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          accountStatus: true,
          customerProfile: { select: { name: true } },
        },
        take: 5,
      }),
      prisma.companionProfile.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { displayName: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          verificationStatus: true,
          city: { select: { name: true } },
        },
        take: 5,
      }),
      prisma.booking.findMany({
        where: {
          OR: [
            { bookingNumber: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          status: true,
          customer: { select: { email: true } },
          companion: { select: { displayName: true } },
        },
        take: 5,
      }),
      prisma.payment.findMany({
        where: {
          OR: [
            { paymentNumber: { contains: q, mode: 'insensitive' } },
            { razorpayOrderId: { contains: q, mode: 'insensitive' } },
            { razorpayPaymentId: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          paymentNumber: true,
          paymentType: true,
          amount: true,
          status: true,
          razorpayPaymentId: true,
          user: { select: { email: true } },
        },
        take: 5,
      }),
      prisma.report.findMany({
        where: {
          OR: [
            { reason: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          reason: true,
          status: true,
          reporter: { select: { email: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      query: q,
      results: {
        users,
        companions,
        bookings,
        payments,
        reports,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

