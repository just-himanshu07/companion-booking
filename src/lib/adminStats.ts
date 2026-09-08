import { prisma } from '@/lib/db';

export async function getAdminStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    userRoleCounts,
    userStatusCounts,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    unverifiedUsersCount,
    totalCompanions,
    companionVerifCounts,
    bookingStatusCounts,
    failedPaymentsCount,
    refundsCount,
    openReportsCount,
    totalRegFeeAgg,
    todayRegFeeAgg,
    weekRegFeeAgg,
    monthRegFeeAgg,
    totalBookingAgg,
    todayBookingAgg,
    weekBookingAgg,
    monthBookingAgg,
    recentUsers,
    recentBookings,
    recentRegPayments,
    recentBookingComms,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.groupBy({ by: ['accountStatus'], _count: true }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { isEmailVerified: false } }),
    prisma.user.count({ where: { role: 'COMPANION' } }),
    prisma.companionProfile.groupBy({ by: ['verificationStatus'], _count: true }),
    prisma.booking.groupBy({ by: ['status'], _count: true }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.refund.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),

    // Aggregates for Finance
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', paymentType: 'REGISTRATION_FEE' },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', paymentType: 'REGISTRATION_FEE', createdAt: { gte: startOfToday } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', paymentType: 'REGISTRATION_FEE', createdAt: { gte: startOfWeek } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', paymentType: 'REGISTRATION_FEE', createdAt: { gte: startOfMonth } },
    }),
    prisma.booking.aggregate({
      _sum: { commissionAmount: true, totalAmount: true },
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] } },
    }),
    prisma.booking.aggregate({
      _sum: { commissionAmount: true },
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] }, createdAt: { gte: startOfToday } },
    }),
    prisma.booking.aggregate({
      _sum: { commissionAmount: true },
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] }, createdAt: { gte: startOfWeek } },
    }),
    prisma.booking.aggregate({
      _sum: { commissionAmount: true },
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] }, createdAt: { gte: startOfMonth } },
    }),

    // Recent 7 days for trendSeries (selecting only minimal fields)
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: { status: 'SUCCESS', paymentType: 'REGISTRATION_FEE', createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, amount: true },
    }),
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'] }, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, commissionAmount: true },
    }),
  ]);

  // Process User Role Counts
  let totalCustomers = 0;
  let totalCompanionsFromRole = 0;
  let totalUsersCount = 0;
  for (const item of userRoleCounts) {
    totalUsersCount += item._count;
    if (item.role === 'CUSTOMER') totalCustomers = item._count;
    if (item.role === 'COMPANION') totalCompanionsFromRole = item._count;
  }

  // Process User Status Counts
  let activeUsers = 0;
  let pendingUsers = 0;
  let suspendedUsers = 0;
  let bannedUsers = 0;
  for (const item of userStatusCounts) {
    if (item.accountStatus === 'ACTIVE') activeUsers = item._count;
    if (item.accountStatus === 'PENDING') pendingUsers = item._count;
    if (item.accountStatus === 'SUSPENDED') suspendedUsers = item._count;
    if (item.accountStatus === 'BANNED') bannedUsers = item._count;
  }
  const pendingUnverifiedUsers = pendingUsers + unverifiedUsersCount;

  // Process Companion Verification Counts
  let verifiedCompanions = 0;
  let pendingCompanionApps = 0;
  for (const item of companionVerifCounts) {
    if (item.verificationStatus === 'VERIFIED') verifiedCompanions = item._count;
    if (item.verificationStatus === 'PENDING' || item.verificationStatus === 'UNDER_REVIEW') {
      pendingCompanionApps += item._count;
    }
  }

  // Process Booking Status Counts
  let totalBookings = 0;
  let pendingBookings = 0;
  let activeBookings = 0;
  let completedBookings = 0;
  let cancelledBookings = 0;
  for (const item of bookingStatusCounts) {
    totalBookings += item._count;
    if (item.status === 'PENDING' || item.status === 'PAYMENT_PENDING') pendingBookings += item._count;
    if (item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS') activeBookings += item._count;
    if (item.status === 'COMPLETED') completedBookings += item._count;
    if (item.status === 'CANCELLED') cancelledBookings += item._count;
  }

  // Process Revenue
  const registrationRevenue = totalRegFeeAgg._sum.amount || 0;
  const bookingCommissionRevenue = totalBookingAgg._sum.commissionAmount || 0;
  const bookingVolume = totalBookingAgg._sum.totalAmount || 0;
  const totalRevenue = registrationRevenue + bookingCommissionRevenue;

  const todayRevenue = (todayRegFeeAgg._sum.amount || 0) + (todayBookingAgg._sum.commissionAmount || 0);
  const weekRevenue = (weekRegFeeAgg._sum.amount || 0) + (weekBookingAgg._sum.commissionAmount || 0);
  const monthRevenue = (monthRegFeeAgg._sum.amount || 0) + (monthBookingAgg._sum.commissionAmount || 0);

  // Process Trend Series (7 Days)
  const trendSeries = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayStartStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    const dayRegsCount = recentUsers.filter((u) => u.createdAt >= dayStart && u.createdAt < dayEnd).length;
    const dayBookingsCount = recentBookings.filter((b) => b.createdAt >= dayStart && b.createdAt < dayEnd).length;

    const dayRegsRev = recentRegPayments
      .filter((p) => p.createdAt >= dayStart && p.createdAt < dayEnd)
      .reduce((sum, p) => sum + p.amount, 0);

    const dayCommsRev = recentBookingComms
      .filter((b) => b.createdAt >= dayStart && b.createdAt < dayEnd)
      .reduce((sum, b) => sum + b.commissionAmount, 0);

    trendSeries.push({
      day: dayName,
      date: dayStartStr,
      registrations: dayRegsCount,
      bookings: dayBookingsCount,
      revenue: dayRegsRev + dayCommsRev,
    });
  }

  return {
    users: {
      total: totalUsersCount,
      today: newUsersToday,
      week: newUsersThisWeek,
      month: newUsersThisMonth,
      active: activeUsers,
      pending: pendingUnverifiedUsers,
      suspended: suspendedUsers,
      banned: bannedUsers,
      customers: totalCustomers,
      companions: totalCompanionsFromRole || totalCompanions,
    },
    companions: {
      total: totalCompanions,
      active: verifiedCompanions,
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
      registrationRevenue,
      bookingCommissionRevenue,
      bookingVolume,
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
  };
}

