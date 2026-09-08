import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlatformSettings } from '@/lib/razorpay';

export async function GET() {
  try {
    await requireRole(['ADMIN']);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsers,
      pendingUnverifiedUsers,
      suspendedUsers,
      bannedUsers,
      totalCustomers,
      totalCompanions,
      activeCompanions,
      verifiedCompanions,
      pendingCompanionApps,
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      successfulPayments,
      failedPaymentsCount,
      refundsCount,
      openReportsCount,
      platformSettings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.user.count({ where: { OR: [{ accountStatus: 'PENDING' }, { isEmailVerified: false }] } }),
      prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
      prisma.user.count({ where: { accountStatus: 'BANNED' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'COMPANION' } }),
      prisma.companionProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.companionProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.companionProfile.count({ where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ['PENDING', 'PAYMENT_PENDING'] } } }),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.findMany({ where: { status: 'SUCCESS' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.refund.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      getPlatformSettings(),
    ]);

    // Financial Calculation
    const regPayments = successfulPayments.filter((p) => p.paymentType === 'REGISTRATION_FEE');
    const totalRegistrationRevenue = regPayments.reduce((sum, p) => sum + p.amount, 0);

    const completedBookingList = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] } },
      select: { commissionAmount: true, totalAmount: true, createdAt: true },
    });

    const totalBookingCommissionRevenue = completedBookingList.reduce((sum, b) => sum + b.commissionAmount, 0);
    const totalBookingVolume = completedBookingList.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRevenue = totalRegistrationRevenue + totalBookingCommissionRevenue;

    // Time-scoped Revenue Calculations
    const todayRegRev = regPayments.filter((p) => new Date(p.createdAt) >= startOfToday).reduce((sum, p) => sum + p.amount, 0);
    const weekRegRev = regPayments.filter((p) => new Date(p.createdAt) >= startOfWeek).reduce((sum, p) => sum + p.amount, 0);
    const monthRegRev = regPayments.filter((p) => new Date(p.createdAt) >= startOfMonth).reduce((sum, p) => sum + p.amount, 0);

    const todayCommRev = completedBookingList.filter((b) => new Date(b.createdAt) >= startOfToday).reduce((sum, b) => sum + b.commissionAmount, 0);
    const weekCommRev = completedBookingList.filter((b) => new Date(b.createdAt) >= startOfWeek).reduce((sum, b) => sum + b.commissionAmount, 0);
    const monthCommRev = completedBookingList.filter((b) => new Date(b.createdAt) >= startOfMonth).reduce((sum, b) => sum + b.commissionAmount, 0);

    const todayRevenue = todayRegRev + todayCommRev;
    const weekRevenue = weekRegRev + weekCommRev;
    const monthRevenue = monthRegRev + monthCommRev;

    // 7-Day Trend Series for Charts
    const days = 7;
    const trendSeries = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayRegCount = await prisma.user.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });

      const dayBookingsCount = await prisma.booking.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });

      const dayRegsRev = regPayments
        .filter((p) => new Date(p.createdAt) >= dayStart && new Date(p.createdAt) < dayEnd)
        .reduce((sum, p) => sum + p.amount, 0);

      const dayCommsRev = completedBookingList
        .filter((b) => new Date(b.createdAt) >= dayStart && new Date(b.createdAt) < dayEnd)
        .reduce((sum, b) => sum + b.commissionAmount, 0);

      trendSeries.push({
        day: dayName,
        date: dayStart.toISOString().split('T')[0],
        registrations: dayRegCount,
        bookings: dayBookingsCount,
        revenue: dayRegsRev + dayCommsRev,
      });
    }

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          today: newUsersToday,
          week: newUsersThisWeek,
          month: newUsersThisMonth,
          active: activeUsers,
          pending: pendingUnverifiedUsers,
          suspended: suspendedUsers,
          banned: bannedUsers,
          customers: totalCustomers,
          companions: totalCompanions,
        },
        companions: {
          total: totalCompanions,
          active: activeCompanions,
          verified: verifiedCompanions,
          pendingApps: pendingCompanionApps,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          active: activeBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
        },
        finance: {
          totalRevenue,
          registrationRevenue: totalRegistrationRevenue,
          bookingCommissionRevenue: totalBookingCommissionRevenue,
          bookingVolume: totalBookingVolume,
          todayRevenue,
          weekRevenue,
          monthRevenue,
          failedPayments: failedPaymentsCount,
          refunds: refundsCount,
        },
        reports: {
          open: openReportsCount,
        },
        trendSeries,
      },
      settings: platformSettings,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
