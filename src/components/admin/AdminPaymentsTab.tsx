'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminPaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1, totalCount: 0 });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPayments = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: debouncedSearch,
        paymentType,
        status,
      });

      const res = await fetch(`/api/admin/payments?${params}`, { signal });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch payments');

      setPayments(data.payments || []);
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
    fetchPayments(controller.signal);
    return () => controller.abort();
  }, [page, debouncedSearch, paymentType, status]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Financial Transaction Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Audit verified server-side payment records, Razorpay order/payment IDs, and transaction statuses. Total ({pagination.totalCount})
            </p>
          </div>

          <button
            onClick={() => fetchPayments()}
            className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by payment #, Razorpay ID, or user email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={paymentType}
            onChange={(e) => {
              setPaymentType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">All Payment Types</option>
            <option value="REGISTRATION_FEE">Registration Fee (₹399)</option>
            <option value="BOOKING_PAYMENT">Booking Payment</option>
            <option value="REFUND">Refund</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Payment #</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Razorpay Payment ID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block font-mono">{p.user?.email}</span>
                      <span className="text-[10px] text-slate-400 block">{p.user?.role}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.paymentType === 'REGISTRATION_FEE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {p.paymentType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-black text-emerald-600 text-sm">₹{p.amount}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {p.razorpayPaymentId || <span className="text-slate-400 italic">Pending capture</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="View Payment Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
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

      {/* PAYMENT DETAIL MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Payment Audit Detail</h3>
                <span className="text-xs text-emerald-600 font-mono font-bold">{selectedPayment.paymentNumber}</span>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 font-mono">
                <span className="font-bold text-slate-900 block font-sans">Razorpay Transaction Identifiers</span>
                <p>Order ID: <strong>{selectedPayment.razorpayOrderId}</strong></p>
                <p>Payment ID: <strong>{selectedPayment.razorpayPaymentId || 'N/A'}</strong></p>
                <p>Signature: <strong>{selectedPayment.razorpaySignature ? 'Verified Server HMAC' : 'Unsigned / Pending'}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block">Payer User</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedPayment.user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Payment Amount</span>
                  <span className="font-black text-emerald-600 text-sm">₹{selectedPayment.amount} {selectedPayment.currency}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Payment Type</span>
                  <span className="font-semibold text-slate-900">{selectedPayment.paymentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Server Status</span>
                  <span className="font-bold text-slate-900">{selectedPayment.status}</span>
                </div>
              </div>

              {selectedPayment.errorReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  <span className="font-bold block">Transaction Error:</span>
                  <p>{selectedPayment.errorReason}</p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 font-mono">
                Created: {new Date(selectedPayment.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

