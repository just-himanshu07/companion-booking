'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, X, Calendar, Clock, DollarSign } from 'lucide-react';

interface BookingFormModalProps {
  request: {
    id: string;
    requestedDate: string;
    requestedStartTime: string;
    requestedDuration: number;
    experienceType: string;
    generalArea?: string | null;
    companion: {
      id: string;
      displayName: string;
      hourlyPrice: number;
      activities?: { activity: { id: string; name: string } }[];
    };
  };
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export default function BookingFormModal({
  request,
  isOpen,
  onClose,
  currentUser,
}: BookingFormModalProps) {
  const router = useRouter();
  const companion = request.companion;
  const duration = request.requestedDuration;
  const totalPrice = companion.hourlyPrice * duration;

  const [notes, setNotes] = useState(request.generalArea ? `Meeting locality: ${request.generalArea}` : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feeModalOpen, setFeeModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.role !== 'CUSTOMER') {
      setError('Only customer accounts can book companions.');
      return;
    }

    if (!currentUser.isRegistrationFeePaid) {
      setFeeModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      // 1. Resolve matching activityId from companion's activities if available
      const matchingActivity = companion.activities?.find(
        (a) =>
          a.activity.name.toLowerCase() === request.experienceType.toLowerCase() ||
          a.activity.id === request.experienceType
      );
      const selectedActivityId = matchingActivity?.activity.id || companion.activities?.[0]?.activity.id;

      // 2. Call server API to create booking order
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: companion.id,
          ...(selectedActivityId ? { activityId: selectedActivityId } : {}),
          date: request.requestedDate,
          startTime: request.requestedStartTime,
          durationHours: duration,
          notes,
          availabilityRequestId: request.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize booking');
      }

      // 3. Client Razorpay Checkout Modal
      const options = {
        key: data.razorpayOrder.keyId,
        amount: data.razorpayOrder.amount * 100,
        currency: data.razorpayOrder.currency || 'INR',
        name: 'Paireva',
        description: `Social booking with ${companion.displayName}`,
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/verify-booking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: data.booking.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              alert('Booking payment successful! Your booking is confirmed.');
              onClose();
              router.push('/profile?tab=bookings');
            } else {
              setError(verifyData.error || 'Payment verification failed');
              setLoading(false);
            }
          } catch (verifyErr: any) {
            setError(verifyErr.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          email: currentUser?.email || '',
        },
        theme: {
          color: '#E94B83',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback testing environment
        const verifyRes = await fetch('/api/payments/verify-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.booking.id,
            razorpayOrderId: data.razorpayOrder.id,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: `mock_sig_pay_${Date.now()}`,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          alert('Booking confirmed!');
          onClose();
          router.push('/profile?tab=bookings');
        } else {
          setError(verifyData.error || 'Failed to confirm booking');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Complete Social Booking</h3>
            <span className="text-xs text-brand-600 font-bold">Confirmed Slot with {companion.displayName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
          {/* Confirmed Details Snapshot */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Experience:</span>
              <span className="font-bold text-slate-900">{request.experienceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-bold text-slate-900">{request.requestedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Start Time:</span>
              <span className="font-bold text-slate-900">{request.requestedStartTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-bold text-slate-900">{duration} hours</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Public Venue / Meeting Details (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Meeting at Bistro 18, Bandra West"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none h-16"
            />
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>₹{companion.hourlyPrice} × {duration} hrs</span>
              <span className="font-semibold text-slate-900">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Safety &amp; Verification Fee</span>
              <span className="font-semibold text-emerald-600">Included</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
              <span>Total Payable</span>
              <span className="text-brand-600">₹{totalPrice}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-brand-600/20 transition-all text-xs cursor-pointer"
          >
            {loading ? 'Processing Payment...' : `Book Now & Pay ₹${totalPrice}`}
          </button>
        </form>
      </div>
    </div>
  );
}

