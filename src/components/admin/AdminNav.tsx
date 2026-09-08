'use client';

import React from 'react';
import {
  BarChart3,
  Users,
  Sparkles,
  Calendar,
  CreditCard,
  ShieldCheck,
  Flag,
  FileSpreadsheet,
  Settings,
  Search,
  Activity,
} from 'lucide-react';

export type AdminTab =
  | 'OVERVIEW'
  | 'USERS'
  | 'COMPANIONS'
  | 'BOOKINGS'
  | 'PAYMENTS'
  | 'VERIFICATION'
  | 'REPORTS'
  | 'AUDIT_LOGS'
  | 'SETTINGS';

interface AdminNavProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  openSearchModal: () => void;
  pendingActionsCount: {
    verifications: number;
    reports: number;
  };
}

export default function AdminNav({
  activeTab,
  setActiveTab,
  openSearchModal,
  pendingActionsCount,
}: AdminNavProps) {
  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: BarChart3 },
    { id: 'USERS', label: 'User Directory', icon: Users },
    { id: 'COMPANIONS', label: 'Companions', icon: Sparkles, badge: pendingActionsCount.verifications },
    { id: 'BOOKINGS', label: 'Bookings', icon: Calendar },
    { id: 'PAYMENTS', label: 'Payments & Revenue', icon: CreditCard },
    { id: 'VERIFICATION', label: 'Verification Center', icon: ShieldCheck },
    { id: 'REPORTS', label: 'Reports & Complaints', icon: Flag, badge: pendingActionsCount.reports },
    { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: FileSpreadsheet },
    { id: 'SETTINGS', label: 'Platform Config', icon: Settings },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center font-black text-white text-lg shadow-md shadow-brand-600/30">
              P
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight">Admin Control Center</span>
              <span className="block text-[10px] text-slate-400 font-mono">Paireva Executive Suite v2.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSearchModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">Search platform...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-900 text-[10px] text-slate-400 rounded font-mono border border-slate-700">
                ⌘K
              </kbd>
            </button>

            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">System Live</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 pb-2 border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

