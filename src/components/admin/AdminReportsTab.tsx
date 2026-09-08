'use client';

import React, { useState, useEffect } from 'react';
import { Flag, Search, Filter, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';

export default function AdminReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1, totalCount: 0 });

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('RESOLVED');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchReports = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: debouncedSearch,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/reports?${params}`, { signal });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');

      setReports(data.reports || []);
      setPagination(data.pagination || { totalPages: 1, totalCount: 0 });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => controller.abort();
  }, [page, debouncedSearch, statusFilter]);

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: updateStatus,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve report');

      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-600" /> Platform Reports &amp; Complaints Queue
            </h2>
            <p className="text-xs text-slate-500">
              Review user safety complaints, moderate reported profiles, and log resolution audit trails.
            </p>
          </div>

          <button
            onClick={() => fetchReports()}
            className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by reason, description, or user email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="">All Report Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Reporter</th>
                <th className="py-3.5 px-4">Reported User</th>
                <th className="py-3.5 px-4">Reason / Complaint</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Filed Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-44"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No reports found.</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.reporter?.email}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                      {r.reportedUser?.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{r.reason}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{r.description}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'PENDING'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setUpdateStatus(r.status);
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px] transition-colors cursor-pointer"
                      >
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* REPORT MODERATION DIALOG */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Moderate Platform Report</h3>
                <span className="text-xs text-rose-600 font-mono font-bold">Reason: {selectedReport.reason}</span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <p>Reporter: <strong>{selectedReport.reporter?.email}</strong></p>
                <p>Reported User: <strong>{selectedReport.reportedUser?.email}</strong></p>
                <p className="pt-2 text-slate-700 leading-relaxed font-sans">
                  Description: &quot;{selectedReport.description}&quot;
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Set Report Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Resolution Notes (Audit Trail)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes on resolution or actions taken..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveReport}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

