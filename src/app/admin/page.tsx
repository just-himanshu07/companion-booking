import React from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { getAdminStats } from '@/lib/adminStats';
import { getPlatformSettings } from '@/lib/razorpay';
import AdminControlCenter from '@/components/admin/AdminControlCenter';

export default async function AdminDashboardPage() {
  const currentUser = await getSessionUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch initial executive stats and platform settings in parallel via aggregated queries
  const [initialStats, platformSettings] = await Promise.all([
    getAdminStats(),
    getPlatformSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />
      <AdminControlCenter initialStats={initialStats} initialSettings={platformSettings} />
      <Footer />
    </div>
  );
}
