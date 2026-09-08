import React from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlatformSettings } from '@/lib/razorpay';
import AdminControlCenter from '@/components/admin/AdminControlCenter';

export default async function AdminDashboardPage() {
  const currentUser = await getSessionUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch initial executive stats
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
    verifiedCompanions,
    pendingVerifications,
    totalBookings,
    pendingBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
    paidPayments,
    failedPaymentsCount,
    refundsCount,
    openReportsCount,
    platformSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
    prisma.user.count({ where: { OR: [{ accountStatus: 'PENDING' }, { isEmailVerified: false }] } }),
    prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
    prisma.user.count({ where: { accountStatus: 'BANNED' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'COMPANION' } }),
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

  const regPayments = paidPayments.filter((p) => p.paymentType === 'REGISTRATION_FEE');
  const totalRegistrationRevenue = regPayments.reduce((sum, p) => sum + p.amount, 0);

  const completedBookingsList = await prisma.booking.findMany({
    where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] } },
    select: { commissionAmount: true, totalAmount: true },
  });
  const totalCommissionRevenue = completedBookingsList.reduce((sum, b) => sum + b.commissionAmount, 0);
  const totalBookingVolume = completedBookingsList.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalRevenue = totalRegistrationRevenue + totalCommissionRevenue;

  const initialStats = {
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
      active: verifiedCompanions,
      verified: verifiedCompanions,
      pendingApps: pendingVerifications,
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
      bookingCommissionRevenue: totalCommissionRevenue,
      bookingVolume: totalBookingVolume,
      failedPayments: failedPaymentsCount,
      refunds: refundsCount,
    },
    reports: {
      open: openReportsCount,
    },
    trendSeries: [],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />
      <AdminControlCenter initialStats={initialStats} initialSettings={platformSettings} />
      <Footer />
    </div>
  );
}
