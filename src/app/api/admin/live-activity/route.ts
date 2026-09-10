import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    await requireRole(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const perCategoryTake = Math.min(10, Math.ceil(limit / 2));

    const [
      recentUsers,
      recentPayments,
      recentBookings,
      recentReports,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: perCategoryTake,
        select: {
          id: true,
          email: true,
          role: true,
          accountStatus: true,
          isEmailVerified: true,
          createdAt: true,
        },
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        take: perCategoryTake,
        select: {
          id: true,
          paymentNumber: true,
          paymentType: true,
          amount: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: perCategoryTake,
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          customer: { select: { email: true } },
          companion: { select: { displayName: true } },
        },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: perCategoryTake,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          reporter: { select: { email: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: perCategoryTake,
        select: {
          id: true,
          action: true,
          targetType: true,
          details: true,
          createdAt: true,
          admin: { select: { email: true } },
        },
      }),
    ]);

    // Format events into a single chronological activity stream
    const activities: any[] = [];

    recentUsers.forEach((u) => {
      activities.push({
        id: `user_${u.id}`,
        type: 'USER_REGISTERED',
        title: 'New User Registered',
        description: `${u.email} (${u.role}) created an account`,
        timestamp: u.createdAt,
        badgeColor: 'bg-blue-100 text-blue-800',
      });
    });

    recentPayments.forEach((p) => {
      activities.push({
        id: `pay_${p.id}`,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        description: `₹${p.amount} received from ${p.user.email} (${p.paymentType})`,
        timestamp: p.createdAt,
        badgeColor: 'bg-emerald-100 text-emerald-800',
      });
    });

    recentBookings.forEach((b) => {
      activities.push({
        id: `book_${b.id}`,
        type: 'BOOKING_CREATED',
        title: 'Booking Activity',
        description: `Booking #${b.bookingNumber} (${b.status}) for ${b.companion.displayName}`,
        timestamp: b.createdAt,
        badgeColor: 'bg-purple-100 text-purple-800',
      });
    });

    recentReports.forEach((r) => {
      activities.push({
        id: `report_${r.id}`,
        type: 'REPORT_FILED',
        title: 'User Report Filed',
        description: `Report: "${r.reason}" filed by ${r.reporter.email}`,
        timestamp: r.createdAt,
        badgeColor: 'bg-rose-100 text-rose-800',
      });
    });

    recentAuditLogs.forEach((l) => {
      activities.push({
        id: `audit_${l.id}`,
        type: 'ADMIN_ACTION',
        title: 'Admin Action Executed',
        description: `${l.action} on ${l.targetType} by ${l.admin.email}`,
        timestamp: l.createdAt,
        badgeColor: 'bg-amber-100 text-amber-800',
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const duration = Date.now() - startTime;
    return NextResponse.json(
      { activities: activities.slice(0, limit), queryDurationMs: duration },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
