'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, RefreshCw, Sparkles, MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';
import AskAvailabilityModal from '@/components/AskAvailabilityModal';
import BookingFormModal from '@/components/BookingFormModal';

interface CustomerRequestItem {
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
  companion: {
    id: string;
    displayName: string;
    username: string;
    profilePhoto?: string | null;
    hourlyPrice: number;
    city: { name: string };
    activities?: { activity: { id: string; name: string } }[];
  };
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
    conversation?: { id: string } | null;
  } | null;
}

interface CustomerAvailabilityRequestsProps {
  initialRequests: CustomerRequestItem[];
  currentUser: any;
}

export default function CustomerAvailabilityRequests({
  initialRequests,
  currentUser,
}: CustomerAvailabilityRequestsProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<CustomerRequestItem[]>(initialRequests);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Selected for new request modal
  const [reAskCompanion, setReAskCompanion] = useState<any | null>(null);

  // Selected for booking modal
  const [bookingRequest, setBookingRequest] = useState<CustomerRequestItem | null>(null);

  const fetchLatestRequests = async () => {
    try {
      const res = await fetch('/api/availability-requests');
      const data = await res.json();
      if (res.ok && data.requests) {
        setRequests(data.requests);
      }
    } catch (e) {
      // silent retry
    }
  };

  const handleAcceptCounter = async (requestId: string) => {
    setActionLoading(requestId);
    setError('');

    try {
      const res = await fetch(`/api/availability-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT_COUNTER' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept counter proposal.');
      }

      await fetchLatestRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" /> My Availability Requests
          </h3>
          <p className="text-xs text-slate-500">
            Track your availability inquiries sent to companions and complete confirmed bookings.
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

      {/* List of Requests */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative border border-slate-200">
                    {r.companion.profilePhoto ? (
                      <img src={r.companion.profilePhoto} alt={r.companion.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {r.companion.displayName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/companions/${r.companion.username}`} className="text-base font-extrabold text-slate-900 hover:text-brand-600 transition-colors">
                      {r.companion.displayName}
                    </Link>
                    <span className="text-xs text-slate-500 block">{r.companion.city.name} • ₹{r.companion.hourlyPrice}/hr</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full text-center ${
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
                  {r.status === 'ACCEPTED'
                    ? 'Availability Confirmed ✓'
                    : r.status === 'COUNTER_PROPOSED'
                    ? 'Alternative Time Suggested'
                    : r.status === 'PENDING'
                    ? 'Request Pending'
                    : r.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Experience</span>
                  <span className="font-bold text-slate-900">{r.experienceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Date &amp; Time</span>
                  <span className="font-bold text-slate-900">{r.requestedDate} at {r.requestedStartTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Duration</span>
                  <span className="font-bold text-slate-900">{r.requestedDuration} hrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Locality</span>
                  <span className="font-bold text-slate-900">{r.generalArea || 'Flexible'}</span>
                </div>
              </div>

              {/* Status Specific UI & Action CTAs */}
              {r.status === 'ACCEPTED' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs">
                  <div>
                    <span className="font-bold text-emerald-900 block text-sm">Availability Confirmed!</span>
                    <p className="text-emerald-700">
                      {r.companion.displayName} is available for {r.requestedDate} at {r.requestedStartTime}. Complete your booking now to reserve this slot.
                    </p>
                  </div>
                  <button
                    onClick={() => setBookingRequest(r)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    Book Now →
                  </button>
                </div>
              )}

              {r.status === 'COUNTER_PROPOSED' && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-3">
                  <div>
                    <span className="font-bold text-sm block">Alternative Time Suggested</span>
                    <p className="mt-0.5">
                      {r.companion.displayName} suggested: <strong>{r.counterDate} at {r.counterStartTime} ({r.counterDuration} hrs)</strong>.
                    </p>
                    {r.companionMessage && <p className="italic mt-1 text-amber-800">&quot;{r.companionMessage}&quot;</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAcceptCounter(r.id)}
                      disabled={actionLoading === r.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Accept &amp; Continue to Booking
                    </button>
                    <button
                      onClick={() => setReAskCompanion({
                        id: r.companion.id,
                        displayName: r.companion.displayName,
                        username: r.companion.username,
                        profilePhoto: r.companion.profilePhoto,
                        hourlyPrice: r.companion.hourlyPrice,
                        activities: [],
                      })}
                      className="bg-white border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Choose Another Time
                    </button>
                  </div>
                </div>
              )}

              {r.status === 'DECLINED' && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-3">
                  <p>Unfortunately, {r.companion.displayName} isn&apos;t available for your requested time.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReAskCompanion({
                        id: r.companion.id,
                        displayName: r.companion.displayName,
                        username: r.companion.username,
                        profilePhoto: r.companion.profilePhoto,
                        hourlyPrice: r.companion.hourlyPrice,
                        activities: [],
                      })}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Ask About Another Time
                    </button>
                    <Link
                      href="/companions"
                      className="bg-white border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50"
                    >
                      Explore Other Companions
                    </Link>
                  </div>
                </div>
              )}

              {r.status === 'EXPIRED' && (
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p>This availability request has expired without response.</p>
                  <button
                    onClick={() => setReAskCompanion({
                      id: r.companion.id,
                      displayName: r.companion.displayName,
                      username: r.companion.username,
                      profilePhoto: r.companion.profilePhoto,
                      hourlyPrice: r.companion.hourlyPrice,
                      activities: [],
                    })}
                    className="bg-brand-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-brand-700 cursor-pointer"
                  >
                    Send New Request
                  </button>
                </div>
              )}

              {r.status === 'BOOKED' && r.booking && (
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-200 text-xs">
                  <div>
                    <span className="font-bold text-purple-900 block text-sm">Booking Confirmed! #{r.booking.bookingNumber}</span>
                    <p className="text-purple-700">Your social engagement is locked and confirmed.</p>
                  </div>
                  {r.booking.conversation && (
                    <Link
                      href={`/messages?conversationId=${r.booking.conversation.id}`}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Booking Chat →
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Availability Requests Yet</h3>
          <p className="text-xs text-slate-500">Ask verified companions about their availability before booking.</p>
          <Link
            href="/companions"
            className="inline-block bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
          >
            Explore Companions
          </Link>
        </div>
      )}

      {/* Re-Ask Modal */}
      {reAskCompanion && (
        <AskAvailabilityModal
          companion={reAskCompanion}
          isOpen={!!reAskCompanion}
          onClose={() => setReAskCompanion(null)}
          currentUser={currentUser}
        />
      )}

      {/* Booking Modal */}
      {bookingRequest && (
        <BookingFormModal
          request={bookingRequest}
          isOpen={!!bookingRequest}
          onClose={() => setBookingRequest(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
