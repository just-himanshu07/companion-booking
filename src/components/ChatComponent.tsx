'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';

interface ChatComponentProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatComponent({ conversationId, currentUserId }: ChatComponentProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
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
      }
    } catch (err) {}
  };

  useEffect(() => {
    isFirstLoad.current = true;
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
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
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    const content = text;
    setText('');
    setLoading(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      senderId: currentUserId,
      text: content,
      createdAt: new Date().toISOString(),
      sender: {
        customerProfile: null,
        companionProfile: null,
        email: 'You',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, text: content }),
      });

      if (res.ok) {
        await fetchMessages();
        scrollToBottom();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err) {
      alert('Network error sending message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-[550px]">
      {/* Safety Notice Bar */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 shrink-0">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>In-Platform Safety Protection: Personal contact details (phone numbers & emails) are auto-masked.</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div ref={chatContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[500px]">
        {messages.map((m) => {
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
        })}
      </div>

      {/* Send Input Box */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}

