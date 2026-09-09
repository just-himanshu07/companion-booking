'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, AlertTriangle, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { validateOffPlatformContent } from '@/lib/offPlatformFilter';

interface ChatComponentProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatComponent({ conversationId, currentUserId }: ChatComponentProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [offPlatformError, setOffPlatformError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 30);
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setBookings(data.bookings || []);
        setAccessError(null);
      } else if (res.status === 403) {
        setAccessError(data.error || 'Messaging is available only after your booking is confirmed.');
      }
    } catch (err) {}
  };

  useEffect(() => {
    isFirstLoad.current = true;
    setAccessError(null);
    setOffPlatformError(null);
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0 || bookings.length > 0) {
      if (isFirstLoad.current) {
        scrollToBottom();
        isFirstLoad.current = false;
      } else {
        if (chatContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
          if (isNearBottom) {
            scrollToBottom();
          }
        }
      }
    }
  }, [messages.length, bookings.length]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (!val.trim()) {
      setOffPlatformError(null);
      return;
    }

    const validation = validateOffPlatformContent(val);
    if (!validation.isValid) {
      setOffPlatformError(validation.errorMessage || null);
    } else {
      setOffPlatformError(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading || accessError) return;

    // Client-side trigger validation before sending
    const validation = validateOffPlatformContent(text);
    if (!validation.isValid) {
      setOffPlatformError(validation.errorMessage || 'Contact or off-platform payment details detected.');
      return; // Do NOT send, preserve text in input for editing
    }

    setOffPlatformError(null);
    const content = text;
    setLoading(true);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, text: content }),
      });

      const data = await res.json();

      if (res.ok) {
        setText(''); // Clear input on successful send only
        await fetchMessages();
        scrollToBottom();
      } else {
        if (res.status === 403) {
          setAccessError(data.error || 'Messaging is available only after your booking is confirmed.');
        } else if (res.status === 400 && data.error) {
          setOffPlatformError(data.error);
        } else {
          setOffPlatformError(data.error || 'Failed to send message');
        }
      }
    } catch (err) {
      setOffPlatformError('Network error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build unified chronological timeline items
  const buildTimelineItems = () => {
    const sortedBookings = [...bookings].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstBookingTime = sortedBookings.length > 0 ? new Date(sortedBookings[0].createdAt).getTime() : null;

    const rawEvents: { type: 'MESSAGE' | 'BOOKING'; createdAt: string; data: any }[] = [];
    messages.forEach((m) => rawEvents.push({ type: 'MESSAGE', createdAt: m.createdAt, data: m }));
    sortedBookings.forEach((b) => rawEvents.push({ type: 'BOOKING', createdAt: b.createdAt, data: b }));

    rawEvents.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const timeline: { type: 'MESSAGE' | 'BOOKING' | 'SECTION_DIVIDER'; id: string; data?: any; label?: string }[] = [];
    let insertedPreBookingHeader = false;
    let insertedPostBookingHeader = false;

    for (let i = 0; i < rawEvents.length; i++) {
      const item = rawEvents[i];

      if (item.type === 'MESSAGE') {
        const msgTime = new Date(item.createdAt).getTime();

        if (firstBookingTime && msgTime < firstBookingTime && !insertedPreBookingHeader) {
          timeline.push({
            type: 'SECTION_DIVIDER',
            id: 'divider-pre-booking',
            label: 'CHAT BEFORE BOOKING',
          });
          insertedPreBookingHeader = true;
        }

        if (firstBookingTime && msgTime >= firstBookingTime && !insertedPostBookingHeader) {
          const lastItem = timeline[timeline.length - 1];
          if (lastItem && lastItem.type !== 'BOOKING') {
            timeline.push({
              type: 'SECTION_DIVIDER',
              id: `divider-post-${item.createdAt}`,
              label: 'AFTER BOOKING',
            });
            insertedPostBookingHeader = true;
          }
        }

        timeline.push({
          type: 'MESSAGE',
          id: item.data.id,
          data: item.data,
        });
      } else if (item.type === 'BOOKING') {
        timeline.push({
          type: 'BOOKING',
          id: `booking-card-${item.data.id}`,
          data: item.data,
        });

        timeline.push({
          type: 'SECTION_DIVIDER',
          id: `divider-after-booking-${item.data.id}`,
          label: 'AFTER BOOKING',
        });
        insertedPostBookingHeader = true;
      }
    }

    return timeline;
  };

  if (accessError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white min-h-[550px]">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-amber-950">Messaging Restricted</h3>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            {accessError}
          </p>
          <div className="text-[11px] text-amber-700 bg-white/80 p-3 rounded-xl border border-amber-200/60 font-semibold">
            Complete your booking payment to confirm your booking and unlock in-platform chat.
          </div>
        </div>
      </div>
    );
  }

  const timelineItems = buildTimelineItems();

  return (
    <div className="flex-1 flex flex-col h-full min-h-[550px]">
      {/* Unified Timeline Feed */}
      <div ref={chatContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[500px]">
        {timelineItems.length > 0 ? (
          timelineItems.map((item) => {
            if (item.type === 'SECTION_DIVIDER') {
              return (
                <div key={item.id} className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              );
            }

            if (item.type === 'BOOKING') {
              const b = item.data;
              return (
                <div key={item.id} className="my-5 mx-auto max-w-md bg-emerald-50/95 border border-emerald-200 rounded-2xl p-4 text-center space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Booking Confirmed</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {b.activity?.name || 'Social Outing'} (#{b.bookingNumber})
                  </h4>
                  <div className="flex items-center justify-center gap-3 text-xs text-slate-600 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {b.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.startTime} • {b.durationHours} {b.durationHours === 1 ? 'hr' : 'hrs'}
                    </span>
                  </div>
                </div>
              );
            }

            // Message Bubble
            const m = item.data;
            const isMe = m.senderId === currentUserId;
            const senderName = m.sender?.customerProfile?.name || m.sender?.companionProfile?.displayName || m.sender?.email;

            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-400 mb-1 px-1">{senderName}</span>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 min-h-[300px]">
            <p className="text-xs">No messages yet. Send a message to start the conversation.</p>
          </div>
        )}
      </div>

      {/* Send Input Box & Trigger-Based Validation Alert */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type your message..."
            disabled={!!accessError}
            className={`flex-1 px-4 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
              offPlatformError
                ? 'border-amber-400 focus:ring-amber-500 bg-amber-50/20'
                : 'border-slate-200 focus:ring-brand-500'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !text.trim() || !!accessError || !!offPlatformError}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>

        {/* Dynamic Trigger-Based Inline Error Notice */}
        {offPlatformError && (
          <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in zoom-in-95">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug font-medium">
              <p className="font-semibold text-amber-950">⚠️ {offPlatformError}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
