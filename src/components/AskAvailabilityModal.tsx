'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Sparkles, AlertCircle, ShieldCheck, X } from 'lucide-react';

interface AskAvailabilityModalProps {
  companion: {
    id: string;
    displayName: string;
    username: string;
    profilePhoto?: string | null;
    hourlyPrice: number;
    activities: { activity: { id: string; name: string } }[];
  };
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

const EXPERIENCES = [
  'Coffee Date',
  'Event Companion',
  'Conversation',
  'Dining / Outing',
  'Movie / Activity',
  'Casual Outing',
  'General Companionship',
];

export default function AskAvailabilityModal({
  companion,
  isOpen,
  onClose,
  currentUser,
}: AskAvailabilityModalProps) {
  const router = useRouter();

  // Tomorrow's date default
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [date, setDate] = useState(tomorrowStr);
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(2);
  const [experience, setExperience] = useState(EXPERIENCES[0]);
  const [generalArea, setGeneralArea] = useState('');
  const [message, setMessage] = useState('');
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-generate suggested message
  useEffect(() => {
    if (!isCustomMessage) {
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : date;
      const suggested = `Hi ${companion.displayName}! I'm interested in booking you on ${formattedDate} around ${time} for ${experience}. Are you available?`;
      setMessage(suggested);
    }
  }, [date, time, experience, companion.displayName, isCustomMessage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentUser) {
      router.push(`/login?redirectTo=/companions/${companion.username}?action=ask_availability`);
      return;
    }

    if (currentUser.role !== 'CUSTOMER') {
      setError('Only customer accounts can send availability requests.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/availability-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: companion.id,
          requestedDate: date,
          requestedStartTime: time,
          requestedDuration: duration,
          experienceType: experience,
          generalArea,
          customerMessage: message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send availability request.');
      }

      setSuccessMsg('Availability request sent successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        onClose();
        router.push('/profile?tab=requests');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-black text-slate-900">Ask {companion.displayName}'s Availability</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Send a structured request to check if {companion.displayName} is free for your date.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred Start Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 cursor-pointer"
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
          </div>

          {/* Duration */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Duration</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setDuration(h)}
                  className={`px-3.5 py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                    duration === h
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h} {h === 1 ? 'hour' : h === 5 ? 'hours+' : 'hours'}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Experience Type</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500 cursor-pointer"
              required
            >
              {EXPERIENCES.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* General Area */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">General Area / Locality (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Bandra West, Indiranagar, Connaught Place"
              value={generalArea}
              onChange={(e) => setGeneralArea(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Message (Optional)</label>
              <span className="text-[10px] text-slate-400">Auto-suggested message</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setIsCustomMessage(true);
              }}
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Safety Notice */}
          <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-tight">
              <strong>Safety Rules:</strong> For your security, contact information (phone, WhatsApp, Instagram, email, UPI) cannot be shared before booking.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-brand-600/20 transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Sending Request...' : 'Send Availability Request →'}
          </button>
        </form>
      </div>
    </div>
  );
}

