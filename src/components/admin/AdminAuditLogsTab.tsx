'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, RefreshCw, Activity } from 'lucide-react';

export default function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1, totalCount: 0 });

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchAuditLogs = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: debouncedSearch,
      });

      const res = await fetch(`/api/admin/audit-logs?${params}`, { signal });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');

      setLogs(data.logs || []);
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
    fetchAuditLogs(controller.signal);
    return () => controller.abort();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" /> Administrative Audit Trail Log
            </h2>
            <p className="text-xs text-slate-500">
              Immutable audit record of administrative actions, moderation events, user status changes, and settings updates. Total ({pagination.totalCount})
            </p>
          </div>

          <button
            onClick={() => fetchAuditLogs()}
            className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit logs by action, admin email, target ID, or details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Admin Email</th>
                <th className="py-3.5 px-4">Target Type</th>
                <th className="py-3.5 px-4">Target ID</th>
                <th className="py-3.5 px-4">Audit Details</th>
                <th className="py-3.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No audit logs recorded.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-purple-600 font-semibold">
                      {log.admin?.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.targetType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.targetId || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                      {log.details || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
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
    </div>
  );
}

