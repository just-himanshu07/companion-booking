import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlatformSettings } from '@/lib/razorpay';

export async function GET() {
  try {
    await requireRole(['ADMIN']);

    const [
      totalUsers,
      totalCustomers,
      totalCompanions,
      verifiedCompanions,
      pendingVerifications,
      totalBookings,
      completedBookings,
      paidPayments,
      refundsCount,
      openReportsCount,
      platformSettings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'COMPANION' } }),
      prisma.companionProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.companionProfile.count({ where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.findMany({ where: { status: 'SUCCESS' } }),
      prisma.refund.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      getPlatformSettings(),
    ]);

    let totalRegistrationRevenue = 0;
    let totalBookingCommissionRevenue = 0;

    const registrationPayments = paidPayments.filter((p) => p.paymentType === 'REGISTRATION_FEE');
    totalRegistrationRevenue = registrationPayments.reduce((sum, p) => sum + p.amount, 0);

    const completedBookingRecords = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] } },
      select: { commissionAmount: true, totalAmount: true },
    });

    totalBookingCommissionRevenue = completedBookingRecords.reduce((sum, b) => sum + b.commissionAmount, 0);
    const totalRevenue = totalRegistrationRevenue + totalBookingCommissionRevenue;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCustomers,
        totalCompanions,
        verifiedCompanions,
        pendingVerifications,
        totalBookings,
        completedBookings,
        totalRevenue,
        totalRegistrationRevenue,
        totalBookingCommissionRevenue,
        refundsCount,
        openReportsCount,
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

