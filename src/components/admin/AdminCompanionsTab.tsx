'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import AdminPhotoManager from '@/components/admin/AdminPhotoManager';

export default function AdminCompanionsTab() {
  const [companions, setCompanions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCompanion, setSelectedCompanion] = useState<any>(null);

  // Verification Review Modal State
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    companion: any;
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  } | null>(null);

  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/companions');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch companions');

      setCompanions(data.companions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanions();
  }, []);

  const handleUpdateStatus = async () => {
    if (!reviewModal) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/companions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: reviewModal.companion.id,
          verificationStatus: reviewModal.status,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update verification status');

      setReviewModal(null);
      setReason('');
      fetchCompanions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanions = companions.filter((c) => {
    const matchesSearch =
      !search ||
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || c.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" /> Companion Applications &amp; Verification
            </h2>
            <p className="text-xs text-slate-500">
              Review submitted profiles, manage companion profile photos, and moderate verification status.
            </p>
          </div>

          <button
            onClick={fetchCompanions}
            className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search companion by display name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Companions Data Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Companion Profile</th>
                <th className="py-3.5 px-4">Location &amp; Rate</th>
                <th className="py-3.5 px-4">Docs Submitted</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading companion applications...
                  </td>
                </tr>
              ) : filteredCompanions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching companion profiles found.
                  </td>
                </tr>
              ) : (
                filteredCompanions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {c.profilePhoto ? (
                          <img
                            src={c.profilePhoto}
                            alt={c.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-200 shrink-0">
                            {c.displayName?.[0] || 'C'}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{c.displayName}</span>
                          <span className="text-[11px] text-purple-600 font-bold block">@{c.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{c.user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{c.city?.name || 'N/A'}</span>
                      <span className="text-[11px] text-emerald-600 font-bold">₹{c.hourlyPrice}/hr</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] inline-flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {c.verificationDocs?.length || 0} Docs
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          c.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : c.verificationStatus === 'UNDER_REVIEW'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.verificationStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      ★ {c.averageRating.toFixed(1)} ({c.totalReviews})
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCompanion(c)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Manage Photos & Inspect Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setReviewModal({ open: true, companion: c, status: 'VERIFIED' })}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => setReviewModal({ open: true, companion: c, status: 'REJECTED' })}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPANION INSPECTION & PHOTO MANAGEMENT MODAL */}
      {selectedCompanion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Companion Application &amp; Photo Management</h3>
                <span className="text-xs text-purple-600 font-bold">@{selectedCompanion.username}</span>
              </div>
              <button
                onClick={() => setSelectedCompanion(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* ADMIN 5-PHOTO MANAGER */}
            <AdminPhotoManager
              userId={selectedCompanion.userId}
              userRole="COMPANION"
              initialPrimaryPhoto={selectedCompanion.profilePhoto || null}
              initialGalleryPhotos={selectedCompanion.gallery || []}
              onPhotosChange={({ primaryPhoto, galleryPhotos }) => {
                setSelectedCompanion((prev: any) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    profilePhoto: primaryPhoto,
                    gallery: galleryPhotos,
                  };
                });
                setCompanions((prev) =>
                  prev.map((c) =>
                    c.id === selectedCompanion.id
                      ? { ...c, profilePhoto: primaryPhoto, gallery: galleryPhotos }
                      : c
                  )
                );
              }}
            />

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block">Full Name</span>
                  <span className="font-bold text-slate-900">{selectedCompanion.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Display Name</span>
                  <span className="font-bold text-slate-900">{selectedCompanion.displayName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Hourly Rate</span>
                  <span className="font-bold text-emerald-600">₹{selectedCompanion.hourlyPrice}/hr</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Age / Gender</span>
                  <span className="font-semibold text-slate-900">{selectedCompanion.age} / {selectedCompanion.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">City</span>
                  <span className="font-semibold text-slate-900">{selectedCompanion.city?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Status</span>
                  <span className="font-bold text-amber-600">{selectedCompanion.verificationStatus}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Bio / Profile Summary</h4>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedCompanion.bio}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Submitted Verification Documents</h4>
                {selectedCompanion.verificationDocs?.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No identity documents submitted yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCompanion.verificationDocs.map((doc: any) => (
                      <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.documentType}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Status: {doc.status}</span>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCompanion(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL / REJECTION DIALOG */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">
              Confirm Companion {reviewModal.status}
            </h3>

            <p className="text-xs text-slate-600">
              Are you sure you want to set the verification status of{' '}
              <span className="font-bold text-slate-900">{reviewModal.companion.displayName}</span> to{' '}
              <span className="font-bold text-purple-600">{reviewModal.status}</span>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notification Message (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason provided to companion..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReviewModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
