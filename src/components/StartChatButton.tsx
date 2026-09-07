'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Lock } from 'lucide-react';

interface StartChatButtonProps {
  companionUserId?: string;
  companionProfileId?: string;
  companionName?: string;
  isBookingConfirmed?: boolean;
  className?: string;
}

export default function StartChatButton({
  companionUserId,
  companionProfileId,
  companionName = 'Companion',
  isBookingConfirmed = false,
  className = 'w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2',
}: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isBookingConfirmed) {
    return (
      <div className="space-y-1.5 w-full">
        <button
          disabled
          type="button"
          className="w-full bg-slate-100 text-slate-400 font-bold text-xs py-3 rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 opacity-80"
          title="Messaging is available after your booking is confirmed."
        >
          <Lock className="w-4 h-4 text-amber-500" />
          <span>Message {companionName} (Locked)</span>
        </button>
        <p className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-xl text-center font-semibold leading-tight">
          Messaging is available after your booking is confirmed.
        </p>
      </div>
    );
  }

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionUserId,
          companionProfileId,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        alert(data.error || 'Messaging is available only after your booking is confirmed.');
        return;
      }

      router.push(`/messages?conversationId=${data.conversationId}`);
    } catch (err) {
      alert('Error connecting to chat service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleStartChat} disabled={loading} className={className}>
      <MessageSquare className="w-4 h-4" />
      {loading ? 'Opening Chat...' : `Message ${companionName}`}
    </button>
  );
}
