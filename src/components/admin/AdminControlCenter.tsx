'use client';

import React, { useState } from 'react';
import AdminNav, { AdminTab } from './AdminNav';
import AdminOverviewTab from './AdminOverviewTab';
import AdminUsersTab from './AdminUsersTab';
import AdminCompanionsTab from './AdminCompanionsTab';
import AdminBookingsTab from './AdminBookingsTab';
import AdminPaymentsTab from './AdminPaymentsTab';
import AdminVerificationTab from './AdminVerificationTab';
import AdminReportsTab from './AdminReportsTab';
import AdminAuditLogsTab from './AdminAuditLogsTab';
import AdminGlobalSearchModal from './AdminGlobalSearchModal';
import AdminSettingsForm from '@/components/AdminSettingsForm';

interface AdminControlCenterProps {
  initialStats: any;
  initialSettings: any;
}

export default function AdminControlCenter({ initialStats, initialSettings }: AdminControlCenterProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const pendingActions = {
    verifications: initialStats.companions?.pendingApps || 0,
    reports: initialStats.reports?.open || 0,
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSearchModal={() => setSearchModalOpen(true)}
        pendingActionsCount={pendingActions}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {activeTab === 'OVERVIEW' && (
          <AdminOverviewTab initialStats={initialStats} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'USERS' && <AdminUsersTab />}
        {activeTab === 'COMPANIONS' && <AdminCompanionsTab />}
        {activeTab === 'BOOKINGS' && <AdminBookingsTab />}
        {activeTab === 'PAYMENTS' && <AdminPaymentsTab />}
        {activeTab === 'VERIFICATION' && <AdminVerificationTab />}
        {activeTab === 'REPORTS' && <AdminReportsTab />}
        {activeTab === 'AUDIT_LOGS' && <AdminAuditLogsTab />}
        {activeTab === 'SETTINGS' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
            <h3 className="text-xl font-black text-slate-900">Platform Configuration &amp; Fees</h3>
            <p className="text-xs text-slate-500">
              Update registration fee (₹399) and platform commission percentage (15%). Changes apply immediately.
            </p>
            <AdminSettingsForm initialSettings={initialSettings} />
          </div>
        )}
      </div>

      <AdminGlobalSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

