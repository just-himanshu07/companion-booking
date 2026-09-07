'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface FeedbackItem {
  id: string;
  type: string;
  rating: number | null;
  message: string;
  status: 'NEW' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string | Date;
  user: {
    email: string;
    role: string;
    customerProfile?: { name: string } | null;
    companionProfile?: { displayName: string } | null;
  };
}

interface AdminFeedbackControlsProps {
  initialFeedbacks: FeedbackItem[];
}

export default function AdminFeedbackControls({ initialFeedbacks }: AdminFeedbackControlsProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    setUpdatingId(feedbackId);

    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status: newStatus }),
      });

      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus as any } : f))
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update feedback status');
      }
    } catch (err) {
      alert('Network error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (feedbacks.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 border border-slate-100 rounded-2xl">
        No user feedback submissions recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((item) => {
        const userName =
          item.user.customerProfile?.name ||
          item.user.companionProfile?.displayName ||
          item.user.email;

        return (
          <div
            key={item.id}
            className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs text-slate-900">{userName}</span>
                <span className="text-[10px] font-mono text-slate-400">({item.user.email})</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {item.user.role}
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 rounded-full">
                  {item.type}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <select
                  value={item.status}
                  disabled={updatingId === item.id}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={`text-xs font-extrabold px-3 py-1 rounded-xl border focus:outline-none transition-all cursor-pointer ${
                    item.status === 'NEW'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : item.status === 'REVIEWED'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : item.status === 'IN_PROGRESS'
                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            {/* Rating Display */}
            {item.rating && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < item.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-600">({item.rating} / 5)</span>
              </div>
            )}

            {/* Message Content */}
            <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-100">
              {item.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}

