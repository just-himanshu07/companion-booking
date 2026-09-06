import React from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminCompanionControls from '@/components/AdminCompanionControls';
import AdminSettingsForm from '@/components/AdminSettingsForm';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlatformSettings } from '@/lib/razorpay';
import { ShieldCheck, Users, Calendar, DollarSign, AlertTriangle, FileText, Settings, Activity } from 'lucide-react';

export default async function AdminDashboardPage() {
  const currentUser = await getSessionUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

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
    companionsList,
    auditLogs,
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
    prisma.companionProfile.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
        city: true,
        verificationDocs: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findMany({
      include: { admin: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ]);

  const regPayments = paidPayments.filter((p) => p.paymentType === 'REGISTRATION_FEE');
  const totalRegistrationRevenue = regPayments.reduce((sum, p) => sum + p.amount, 0);

  const completedBookingsList = await prisma.booking.findMany({
    where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
    select: { commissionAmount: true },
  });
  const totalCommissionRevenue = completedBookingsList.reduce((sum, b) => sum + b.commissionAmount, 0);
  const totalRevenue = totalRegistrationRevenue + totalCommissionRevenue;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-brand-600 uppercase tracking-wider block">Super Admin Portal</span>
            <h1 className="text-3xl font-black text-slate-900">Platform Executive Dashboard</h1>
          </div>
          <div className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> System Active
          </div>
        </div>

        {/* OVERVIEW KPIS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Users</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</div>
            <span className="text-[10px] text-slate-500">{totalCustomers} Clients | {totalCompanions} Companions</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Verified Companions</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCompanions}</div>
            <span className="text-[10px] text-amber-600 font-medium">{pendingVerifications} Pending Review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Bookings</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalBookings}</div>
            <span className="text-[10px] text-slate-500">{completedBookings} Completed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Platform Revenue</span>
            <div className="text-2xl font-black text-brand-600 mt-1">₹{totalRevenue}</div>
            <span className="text-[10px] text-slate-500">Reg: ₹{totalRegistrationRevenue} | Comm: ₹{totalCommissionRevenue}</span>
          </div>
        </div>

        {/* SETTINGS EDITOR & AUDIT LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-600" /> Configurable Settings
            </h3>
            <AdminSettingsForm initialSettings={platformSettings} />
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" /> Admin Audit Logs
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="block text-[10px] text-slate-500">By {log.admin.email}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMPANION VERIFICATION APPROVAL TABLE */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Companion Applications & Document Verification
          </h3>

          <AdminCompanionControls companions={companionsList} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

