'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface BookingFormProps {
  companion: {
    id: string;
    hourlyPrice: number;
    displayName: string;
    activities: { activity: { id: string; name: string } }[];
    availabilitySlots: { id: string; date: string; startTime: string; endTime: string }[];
  };
  currentUser: any;
}

export default function BookingForm({ companion, currentUser }: BookingFormProps) {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState(companion.activities[0]?.activity.id || '');
  const [selectedDate, setSelectedDate] = useState(companion.availabilitySlots[0]?.date || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(companion.availabilitySlots[0]?.startTime || '14:00');
  const [duration, setDuration] = useState(2);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feeModalOpen, setFeeModalOpen] = useState(false);

  const totalPrice = companion.hourlyPrice * duration;

  // Filter slots matching selected date
  const availableSlotsForDate = companion.availabilitySlots.filter((s) => s.date === selectedDate);

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
      // 1. Call server API to validate slot and create booking & Razorpay order
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: companion.id,
          ...(selectedActivity ? { activityId: selectedActivity } : {}),
          date: selectedDate,
          startTime: selectedTime,
          durationHours: duration,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize booking');
      }

      // 2. Client Razorpay Checkout Modal
      const options = {
        key: data.razorpayOrder.keyId,
        amount: data.razorpayOrder.amount * 100,
        currency: data.razorpayOrder.currency || 'INR',
        name: 'Paireva',
        description: `Social booking with ${companion.displayName}`,
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
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
              // Trigger Meta Pixel Purchase Conversion Event upon verified success
              if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                  value: verifyData.amount || data.razorpayOrder.amount,
                  currency: 'INR',
                });
              }

              alert('Booking payment successful! Your booking is confirmed.');
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
        // Fallback for dev testing environment
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
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'Purchase', {
              value: verifyData.amount || data.razorpayOrder.amount,
              currency: 'INR',
            });
          }
          alert('Booking confirmed!');
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

  const handlePayRegistrationFee = async () => {
    try {
      const res = await fetch('/api/payments/registration-order', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create registration order');

      const options = {
        key: data.keyId,
        amount: data.amount * 100,
        currency: data.currency || 'INR',
        name: 'Paireva',
        description: 'One-Time Platform Registration Fee',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/verify-registration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'CompleteRegistration', {
                  value: verifyData.amount || data.amount,
                  currency: 'INR',
                });
              }
              alert('One-time ₹399 Registration fee paid successfully!');
              setFeeModalOpen(false);
              window.location.reload();
            } else {
              alert(verifyData.error || 'Registration fee verification failed');
            }
          } catch (verifyErr: any) {
            alert(verifyErr.message || 'Verification failed');
          }
        },
        prefill: {
          email: currentUser?.email || '',
        },
        theme: {
          color: '#E94B83',
        },
      };

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        const verifyRes = await fetch('/api/payments/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: data.orderId,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: `mock_sig_pay_${Date.now()}`,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'CompleteRegistration', {
              value: verifyData.amount || data.amount,
              currency: 'INR',
            });
          }
          alert('One-time ₹399 Registration fee paid successfully!');
          setFeeModalOpen(false);
          window.location.reload();
        } else {
          alert(verifyData.error || 'Registration fee verification failed');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Registration fee payment failed');
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-rosebrand-50 border border-rosebrand-200 rounded-xl text-xs font-semibold text-rosebrand-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-4">
        {/* Activity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Social Activity</label>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            required
          >
            {companion.activities.map((act) => (
              <option key={act.activity.id} value={act.activity.id}>
                {act.activity.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        {/* Time slot */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time Slot</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            required
          >
            {availableSlotsForDate.length > 0 ? (
              availableSlotsForDate.map((s) => (
                <option key={s.id} value={s.startTime}>
                  {s.startTime} - {s.endTime}
                </option>
              ))
            ) : (
              <>
                <option value="10:00">10:00 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="18:00">06:00 PM</option>
                <option value="20:00">08:00 PM</option>
              </>
            )}
          </select>
        </div>

        {/* Duration */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Duration (Hours)</label>
            <span className="text-xs font-bold text-brand-600">{duration} {duration === 1 ? 'hour' : 'hours'}</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Notes / Venue details (Public venue only)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Meeting at Trident Bistro, Bandra West for dinner."
            className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 h-16 resize-none"
          />
        </div>

        {/* PRICE SUMMARY BREAKDOWN */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>₹{companion.hourlyPrice} × {duration} hrs</span>
            <span className="font-semibold text-slate-900">₹{totalPrice}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Safety & Verification Fee</span>
            <span className="font-semibold text-emerald-600">Included</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
            <span>Total Payable</span>
            <span className="text-brand-600">₹{totalPrice}</span>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? 'Processing Order...' : `Book Now & Pay ₹${totalPrice}`}
        </button>
      </form>

      {/* REGISTRATION FEE REQUIRED MODAL */}
      {feeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">One-Time Registration Fee Required</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To maintain a verified and safe environment for companions, all clients must pay a mandatory one-time registration fee of <span className="font-bold text-slate-900">₹399</span>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Account Verification Fee</span>
                <span className="text-brand-600">₹399</span>
              </div>
              <p className="text-[11px] text-slate-500">Valid for lifetime access & bookings.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayRegistrationFee}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Pay ₹399 Registration Fee
              </button>
              <button
                onClick={() => setFeeModalOpen(false)}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

