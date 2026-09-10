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
  Camera,
  X,
} from 'lucide-react';

export default function AdminVerificationTab() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ALL'>('UNDER_REVIEW');

  // Document Preview Modal State
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter === 'ALL'
        ? '/api/admin/verifications'
        : `/api/admin/verifications?status=${statusFilter}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch verification data');

      setVerifications(json.verifications || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/verifications/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to approve verification');

      alert('Identity verification approved successfully! Account is now ACTIVE.');
      setSelectedVerification(null);
      fetchVerifications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReasonInput.trim()) {
      alert('Please enter a clear reason for rejecting the verification.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/verifications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReasonInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reject verification');

      alert('Identity verification rejected. User has been notified.');
      setShowRejectModal(false);
      setSelectedVerification(null);
      setRejectionReasonInput('');
      fetchVerifications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Identity Verification Queue
          </h2>
          <p className="text-xs text-slate-500">
            Review submitted government ID documents and live selfies to approve customer accounts for platform access.
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'UNDER_REVIEW', label: 'Under Review Queue' },
          { key: 'APPROVED', label: 'Approved Accounts' },
          { key: 'REJECTED', label: 'Rejected Submissions' },
          { key: 'ALL', label: 'All Submissions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Registration Fee</th>
                <th className="py-3.5 px-4">Email Status</th>
                <th className="py-3.5 px-4">Govt ID Type</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4">KYC Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Loading verification submissions...
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No verification submissions found for the selected filter.
                  </td>
                </tr>
              ) : (
                verifications.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.user.customerProfile?.name || 'Customer'}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{item.user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.user.isRegistrationFeePaid ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ₹399 Paid
                        </span>
                      ) : (
                        <span className="font-bold text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.user.isEmailVerified ? (
                        <span className="font-semibold text-emerald-600">Verified</span>
                      ) : (
                        <span className="font-semibold text-amber-600">Unverified</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {item.documentType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-black text-[10px] uppercase px-2.5 py-1 rounded-full border ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedVerification(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Docs</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECURE DOCUMENT & SELFIE REVIEW MODAL */}
      {selectedVerification && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review Identity Verification</h3>
                <span className="text-xs text-slate-500 font-medium">
                  Submitted by {selectedVerification.user.customerProfile?.name} ({selectedVerification.user.email})
                </span>
              </div>
              <button
                onClick={() => setSelectedVerification(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Document */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-brand-600" />
                  {selectedVerification.documentType} (Front)
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 p-2 h-60 flex items-center justify-center">
                  <img
                    src={selectedVerification.documentFrontUrl}
                    alt="Front ID Document"
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* Back Document (if present) */}
              {selectedVerification.documentBackUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-brand-600" />
                    {selectedVerification.documentType} (Back)
                  </span>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 p-2 h-60 flex items-center justify-center">
                    <img
                      src={selectedVerification.documentBackUrl}
                      alt="Back ID Document"
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Live Selfie */}
              <div className="space-y-2 md:col-span-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Live Selfie Capture
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 p-2 h-64 flex items-center justify-center">
                  <img
                    src={selectedVerification.selfieUrl}
                    alt="Live Camera Selfie"
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Approval / Rejection Controls */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-6 py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-rose-200"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Submission</span>
              </button>

              <button
                onClick={() => handleApprove(selectedVerification.id)}
                disabled={actionLoading || selectedVerification.status === 'APPROVED'}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold px-8 py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Account &amp; Activate Access</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT MODAL */}
      {showRejectModal && selectedVerification && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-slate-900 text-sm">Reject Identity Verification</h4>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide a clear reason for rejecting the submission. This reason will be displayed to the customer on their dashboard.
            </p>

            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. The uploaded document is blurry and the selfie face does not match."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none h-24 focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedVerification.id)}
                disabled={actionLoading || !rejectionReasonInput.trim()}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
