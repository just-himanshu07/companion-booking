'use client';

import React, { useState } from 'react';
import { Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import AskAvailabilityModal from '@/components/AskAvailabilityModal';
import StartChatButton from '@/components/StartChatButton';

interface CompanionBookingSidebarProps {
  companion: {
    id: string;
    username: string;
    displayName: string;
    profilePhoto?: string | null;
    hourlyPrice: number;
    userId: string;
    activities: { activity: { id: string; name: string } }[];
  };
  currentUser: any;
  confirmedBooking: any;
  autoOpenAskAvailability?: boolean;
}

export default function CompanionBookingSidebar({
  companion,
  currentUser,
  confirmedBooking,
  autoOpenAskAvailability = false,
}: CompanionBookingSidebarProps) {
  const [askModalOpen, setAskModalOpen] = useState(autoOpenAskAvailability);

  return (
    <div className="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      {/* Rate Header */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Social Companion Rate</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-black text-slate-900">₹{companion.hourlyPrice}</span>
          <span className="text-xs text-slate-500"> / hour</span>
        </div>
      </div>

      {/* Primary CTA: Ask Availability */}
      <div className="space-y-3">
        <button
          onClick={() => setAskModalOpen(true)}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <Calendar className="w-4.5 h-4.5" />
          Ask Availability →
        </button>
        <p className="text-[11px] text-slate-500 text-center font-medium">
          Check if {companion.displayName} is free for your date &amp; time.
        </p>
      </div>

      {/* Direct Messaging (Locked pre-booking, unlocked post-booking) */}
      <div className="border-t border-slate-100 pt-4">
        <StartChatButton
          companionUserId={companion.userId}
          companionName={companion.displayName}
          isBookingConfirmed={!!confirmedBooking}
        />
      </div>

      {/* Safety Rules Badge */}
      <div className="space-y-2 text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Public Social Outings Only</span>
        </div>
        <p className="text-slate-400 leading-normal">
          Strict non-sexual companionship policy. Personal contact information is hidden before booking confirmation.
        </p>
      </div>

      {/* Ask Availability Modal */}
      <AskAvailabilityModal
        companion={companion}
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

