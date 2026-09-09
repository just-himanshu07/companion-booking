'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, RefreshCw, Sparkles, MessageSquare, AlertCircle, Send } from 'lucide-react';
import Link from 'next/link';

interface AvailabilityRequestItem {
  id: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedDuration: number;
  experienceType: string;
  generalArea?: string | null;
  customerMessage?: string | null;
  counterDate?: string | null;
  counterStartTime?: string | null;
  counterDuration?: number | null;
  companionMessage?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTER_PROPOSED' | 'EXPIRED' | 'CANCELLED' | 'BOOKED';
  createdAt: string | Date;
  expiresAt: string | Date;
  customer: {
    id: string;
    email: string;
    customerProfile?: {
      name?: string | null;
      displayAvatar?: string | null;
    } | null;
  };
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
  } | null;
}

interface CompanionAvailabilityRequestsProps {
  initialRequests: AvailabilityRequestItem[];
  companionId: string;
}

export default function CompanionAvailabilityRequests({
  initialRequests,
  companionId,
}: CompanionAvailabilityRequestsProps) {
  const [requests, setRequests] = useState<AvailabilityRequestItem[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'PAST'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Counter proposal modal state
  const [counterModalRequest, setCounterModalRequest] = useState<AvailabilityRequestItem | null>(null);
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('18:00');
  const [counterDuration, setCounterDuration] = useState(2);
  const [companionMessage, setCompanionMessage] = useState('');

  const fetchLatestRequests = async () => {
    try {
      const res = await fetch(`/api/availability-requests?companionId=${companionId}`);
      const data = await res.json();
      if (res.ok && data.requests) {
        setRequests(data.requests);
      }
    } catch (e) {
      // silent retry
    }
  };

  const handleResponse = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    setActionLoading(requestId);
    setError('');

    try {
      const res = await fetch(`/api/availability-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to respond to request.');
      }

      await fetchLatestRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalRequest) return;

    setActionLoading(counterModalRequest.id);
    setError('');

    try {
      const res = await fetch(`/api/availability-requests/${counterModalRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COUNTER_PROPOSE',
          counterDate,
          counterStartTime: counterTime,
          counterDuration,
          companionMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send counter proposal.');
      }

      setCounterModalRequest(null);
      setCompanionMessage('');
      await fetchLatestRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter requests based on tab
  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'PENDING') return r.status === 'PENDING' || r.status === 'COUNTER_PROPOSED';
    if (activeTab === 'ACCEPTED') return r.status === 'ACCEPTED' || r.status === 'BOOKED';
    if (activeTab === 'DECLINED') return r.status === 'DECLINED';
    return r.status === 'EXPIRED' || r.status === 'CANCELLED';
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" /> Availability Requests
          </h3>
          <p className="text-xs text-slate-500">
            Review incoming availability inquiries from clients and confirm or suggest alternative times.
          </p>
        </div>

        <button
          onClick={fetchLatestRequests}
          className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          title="Refresh Requests"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'PENDING' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending ({requests.filter((r) => r.status === 'PENDING' || r.status === 'COUNTER_PROPOSED').length})
        </button>

        <button
          onClick={() => setActiveTab('ACCEPTED')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ACCEPTED' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Confirmed / Booked ({requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'BOOKED').length})
        </button>

        <button
          onClick={() => setActiveTab('DECLINED')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'DECLINED' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Declined ({requests.filter((r) => r.status === 'DECLINED').length})
        </button>

        <button
          onClick={() => setActiveTab('PAST')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'PAST' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Expired / Cancelled ({requests.filter((r) => r.status === 'EXPIRED' || r.status === 'CANCELLED').length})
        </button>
      </div>

      {/* List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((r) => {
            const customerName = r.customer.customerProfile?.name || 'Verified Client';

            return (
              <div key={r.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-200 shrink-0">
                      {customerName[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{customerName}</h4>
                      <span className="text-xs text-brand-600 font-semibold">{r.experienceType}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full text-center ${
                      r.status === 'ACCEPTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.status === 'BOOKED'
                        ? 'bg-purple-100 text-purple-800'
                        : r.status === 'DECLINED'
                        ? 'bg-rose-100 text-rose-800'
                        : r.status === 'COUNTER_PROPOSED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {r.status === 'COUNTER_PROPOSED' ? 'Counter Offered' : r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-semibold">Requested Date</span>
                    <span className="font-bold text-slate-900">{r.requestedDate}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Start Time</span>
                    <span className="font-bold text-slate-900">{r.requestedStartTime}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Duration</span>
                    <span className="font-bold text-slate-900">{r.requestedDuration} hrs</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">General Area</span>
                    <span className="font-bold text-slate-900">{r.generalArea || 'Flexible / TBD'}</span>
                  </div>
                </div>

                {r.customerMessage && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 italic">
                    &quot;{r.customerMessage}&quot;
                  </div>
                )}

                {r.status === 'COUNTER_PROPOSED' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">Your Counter Proposal Sent:</span>
                    <p>{r.counterDate} at {r.counterStartTime} ({r.counterDuration} hrs)</p>
                    {r.companionMessage && <p className="italic">&quot;{r.companionMessage}&quot;</p>}
                  </div>
                )}

                {/* Actions */}
                {r.status === 'PENDING' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/60 pt-3">
                    <button
                      onClick={() => handleResponse(r.id, 'ACCEPT')}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ✓ Available
                    </button>

                    <button
                      onClick={() => handleResponse(r.id, 'DECLINE')}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      ✕ Not Available
                    </button>

                    <button
                      onClick={() => {
                        setCounterModalRequest(r);
                        setCounterDate(r.requestedDate);
                        setCounterTime(r.requestedStartTime);
                        setCounterDuration(r.requestedDuration);
                      }}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Suggest Another Time
                    </button>
                  </div>
                )}

                {r.status === 'BOOKED' && r.booking && (
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
                    <span className="font-bold text-purple-700">Booking Confirmed #{r.booking.bookingNumber}</span>
                    <Link
                      href="/messages"
                      className="px-3.5 py-1.5 bg-brand-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-brand-700"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat Center
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic py-6 text-center">No availability requests in this tab.</p>
      )}

      {/* COUNTER PROPOSAL MODAL */}
      {counterModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-black text-slate-900">Suggest Alternative Time</h4>
              <button
                onClick={() => setCounterModalRequest(null)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alternative Date</label>
                <input
                  type="date"
                  value={counterDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCounterDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alternative Start Time</label>
                <select
                  value={counterTime}
                  onChange={(e) => setCounterTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                  required
                >
                  <option value="10:00">10:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="21:00">09:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={counterDuration}
                  onChange={(e) => setCounterDuration(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message to Client (Optional)</label>
                <textarea
                  value={companionMessage}
                  onChange={(e) => setCompanionMessage(e.target.value)}
                  placeholder="e.g. I can do 8:00 PM instead on Saturday!"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterModalRequest(null)}
                  className="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading === counterModalRequest.id}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Alternative Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
