'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';

export default function AdminVerificationTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVerifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verifications');
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch verification data');

      setData(json.verifications || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const emailOtpStats = data?.emailOtpStats || [];
  const pendingCompanions = data?.pendingCompanions || [];
  const pendingDocs = data?.pendingDocuments || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> System Verification Center
          </h2>
          <p className="text-xs text-slate-500">
            Monitor email OTP verification attempt statistics, active expiration statuses, and pending identity documents.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Email Verifications</span>
          <div className="text-2xl font-black text-amber-600">{emailOtpStats.length}</div>
          <span className="text-[11px] text-slate-500">Users awaiting 6-digit OTP entry</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Companion Applications</span>
          <div className="text-2xl font-black text-purple-600">{pendingCompanions.length}</div>
          <span className="text-[11px] text-slate-500">Companions under review</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Unverified Identity Documents</span>
          <div className="text-2xl font-black text-blue-600">{pendingDocs.length}</div>
          <span className="text-[11px] text-slate-500">Govt ID / Selfie proofs queue</span>
        </div>
      </div>

      {/* EMAIL OTP ATTEMPT HEALTH MONITOR (Zero Secrets Leaked) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-600" /> Email OTP Health &amp; Attempt Monitor
          </h3>
          <span className="text-xs text-slate-400 font-mono">Passwords &amp; Hashes Strictly Hidden</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Email Verified</th>
                <th className="py-3 px-4">Attempts Count</th>
                <th className="py-3 px-4">Last Sent At</th>
                <th className="py-3 px-4">OTP Expiry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading OTP health stats...</td>
                </tr>
              ) : emailOtpStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">All users have verified emails!</td>
                </tr>
              ) : (
                emailOtpStats.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.email}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{u.accountStatus}</td>
                    <td className="py-3 px-4">
                      {u.isEmailVerified ? (
                        <span className="text-emerald-600 font-bold">Verified</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Unverified</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${u.attemptsCount >= 4 ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                        {u.attemptsCount} / 5
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {u.lastSentAt ? new Date(u.lastSentAt).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {u.isExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Expired</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Active (10m window)</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

