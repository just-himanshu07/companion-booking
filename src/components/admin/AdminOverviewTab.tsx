'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface AdminOverviewTabProps {
  initialStats: any;
  setActiveTab: (tab: any) => void;
}

export default function AdminOverviewTab({ initialStats, setActiveTab }: AdminOverviewTabProps) {
  const [stats, setStats] = useState(initialStats);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchStatsAndActivity = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/live-activity'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setLiveActivities(activityData.activities || []);
      }
    } catch (e) {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    fetchStatsAndActivity();
    const interval = setInterval(fetchStatsAndActivity, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const users = stats?.users || {};
  const companions = stats?.companions || {};
  const bookings = stats?.bookings || {};
  const finance = stats?.finance || {};
  const trendSeries = stats?.trendSeries || [];

  // Calculate maximum value for chart scaling
  const maxRegs = Math.max(...trendSeries.map((t: any) => t.registrations), 5);
  const maxRev = Math.max(...trendSeries.map((t: any) => t.revenue), 1000);

  return (
    <div className="space-y-8">
      {/* Executive Quick Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest block">Executive Dashboard</span>
          <h2 className="text-2xl sm:text-3xl font-black">Paireva Platform Metrics</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Real-time analytics across client registrations, companion verifications, Razorpay payments, and booking commissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatsAndActivity}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">Today Revenue</span>
            <span className="text-2xl font-black text-emerald-400">₹{finance.todayRevenue || 0}</span>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{users.total || 0}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{users.today || 0} Today
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Users</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{users.active || 0}</div>
          <div className="text-[11px] text-amber-600 font-semibold">
            {users.pending || 0} Pending OTP
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restricted Users</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{(users.suspended || 0) + (users.banned || 0)}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {users.suspended || 0} Suspended | {users.banned || 0} Banned
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Companions</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">{companions.verified || 0}</div>
          <button
            onClick={() => setActiveTab('COMPANIONS')}
            className="text-[11px] text-brand-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {companions.pendingApps || 0} Review Apps <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bookings</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{bookings.total || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {bookings.completed || 0} Completed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-brand-600">₹{finance.totalRevenue || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Vol: ₹{finance.bookingVolume || 0}
          </div>
        </div>
      </div>

      {/* TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Registrations Trend Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">User Registrations (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Daily new accounts created across Customer &amp; Companion roles</p>
            </div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl">
              +{users.week || 0} This Week
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 pb-2">
            {trendSeries.map((t: any, idx: number) => {
              const heightPercent = Math.max(8, Math.round((t.registrations / maxRegs) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.registrations}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[36px] bg-gradient-to-t from-brand-600 to-rosebrand-500 rounded-t-xl transition-all group-hover:brightness-110"
                  />
                  <span className="text-[10px] font-mono font-semibold text-slate-500">{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Platform Revenue Trend (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Registration fees (₹399) + Booking commission revenue</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
              ₹{finance.weekRevenue || 0} This Week
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 pb-2">
            {trendSeries.map((t: any, idx: number) => {
              const heightPercent = Math.max(8, Math.round((t.revenue / maxRev) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{t.revenue}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-xl transition-all group-hover:brightness-110"
                  />
                  <span className="text-[10px] font-mono font-semibold text-slate-500">{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LIVE ACTIVITY FEED & REVENUE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Activity Stream */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">Live Platform Activity Feed</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Auto-polling 15s</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {liveActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading recent system events...</div>
            ) : (
              liveActivities.map((act) => (
                <div key={act.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${act.badgeColor}`}>
                        {act.title}
                      </span>
                      <span className="font-semibold text-slate-900">{act.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue Summary Breakdown */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
            Financial Ledger Summary
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-semibold">Registration Fees (₹399)</span>
              <span className="font-bold text-slate-900">₹{finance.registrationRevenue || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-semibold">Booking Commissions</span>
              <span className="font-bold text-emerald-600">₹{finance.bookingCommissionRevenue || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-semibold">Failed Transactions</span>
              <span className="font-bold text-rose-600">{finance.failedPayments || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-semibold">Processed Refunds</span>
              <span className="font-bold text-amber-600">{finance.refunds || 0}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Open Payment Ledger <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

