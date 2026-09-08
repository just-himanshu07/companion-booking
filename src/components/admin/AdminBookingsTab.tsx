'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  DollarSign,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminBookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1, totalCount: 0 });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');

      setBookings(data.bookings || []);
      setPagination(data.pagination || { totalPages: 1, totalCount: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Platform Booking &amp; Matching Monitor
            </h2>
            <p className="text-xs text-slate-500">
              Inspect active bookings, financial snapshots, durations, customer/companion pairs, and cancellation reasons. Total ({pagination.totalCount})
            </p>
          </div>

          <button
            onClick={fetchBookings}
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
              placeholder="Search by booking #, customer email, companion username..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Booking #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Companion</th>
                <th className="py-3.5 px-4">Activity &amp; Date</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{b.bookingNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{b.customer?.customerProfile?.name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{b.customer?.email}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-600 block">{b.companion?.displayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">@{b.companion?.username}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{b.activity?.name || 'Social Companion'}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{b.date} ({b.startTime} - {b.endTime})</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600 block">₹{b.totalAmount}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Comm: ₹{b.commissionAmount}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'
                            ? 'bg-purple-100 text-purple-800'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="View Complete Lifecycle"
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

      {/* BOOKING DETAIL MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Booking Lifecycle Detail</h3>
                <span className="text-xs text-blue-600 font-mono font-bold">#{selectedBooking.bookingNumber}</span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block">Customer</span>
                  <span className="font-bold text-slate-900">{selectedBooking.customer?.customerProfile?.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{selectedBooking.customer?.email}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Companion</span>
                  <span className="font-bold text-purple-600">{selectedBooking.companion?.displayName}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">@{selectedBooking.companion?.username}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Activity</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.activity?.name}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Duration</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.durationHours} hours</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Hourly Snapshot</span>
                  <span className="font-semibold text-slate-900">₹{selectedBooking.hourlyPriceSnapshot}/hr</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Status</span>
                  <span className="font-bold text-slate-900">{selectedBooking.status}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">Financial Breakdown</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Booking Amount:</span>
                  <span className="font-bold text-slate-900">₹{selectedBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Platform Commission ({selectedBooking.commissionRateSnapshot}%):</span>
                  <span className="font-bold">₹{selectedBooking.commissionAmount}</span>
                </div>
                <div className="flex justify-between text-purple-600">
                  <span>Companion Earnings:</span>
                  <span className="font-bold">₹{selectedBooking.companionEarnings}</span>
                </div>
              </div>

              {selectedBooking.payment && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 font-mono text-[11px]">
                  <span className="font-bold text-slate-900 block font-sans">Payment Details</span>
                  <p>Razorpay Payment ID: <strong>{selectedBooking.payment.razorpayPaymentId || 'N/A'}</strong></p>
                  <p>Razorpay Order ID: <strong>{selectedBooking.payment.razorpayOrderId}</strong></p>
                  <p>Payment Status: <strong>{selectedBooking.payment.status}</strong></p>
                </div>
              )}

              {selectedBooking.cancellationReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  <span className="font-bold block">Cancellation Reason:</span>
                  <p>{selectedBooking.cancellationReason}</p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedBooking(null)}
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

