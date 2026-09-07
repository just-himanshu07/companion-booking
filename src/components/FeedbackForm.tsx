'use client';

import React, { useState } from 'react';
import { Star, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

const FEEDBACK_TYPES = [
  'General Feedback',
  'Problem / Bug',
  'Suggestion',
  'Feature Request',
  'Complaint',
  'Other',
];

export default function FeedbackForm() {
  const [type, setType] = useState('General Feedback');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          rating,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit feedback. Please try again.');
        return;
      }

      setSuccess(true);
      setType('General Feedback');
      setRating(null);
      setMessage('');
    } catch (err) {
      setError('Network error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3 text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-emerald-950">Thank you for your feedback!</h4>
            <p className="text-xs text-emerald-800 font-medium">
              Your feedback has been received and will help us improve Paireva.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-semibold shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Feedback Category Type */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#292126] uppercase tracking-wider">
            1. Feedback Category <span className="text-[#E94B83]">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-3 bg-[#FFF8F5] border border-[#F47B8F]/30 rounded-xl text-xs font-bold text-[#292126] focus:outline-none focus:ring-2 focus:ring-[#E94B83] focus:bg-white transition-all"
          >
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Rating (Optional 1-5 Stars) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#292126] uppercase tracking-wider">
              2. Overall Experience Rating <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            {rating !== null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="text-[11px] font-bold text-[#E94B83] hover:underline"
              >
                Clear rating
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#FFF8F5] border border-[#F47B8F]/30 p-3.5 rounded-xl">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeScore = hoverRating !== null ? hoverRating : rating;
              const isFilled = activeScore !== null && star <= activeScore;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    } transition-colors`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-bold text-[#756A70] ml-2">
              {rating ? `${rating} of 5 Stars` : 'Tap to rate'}
            </span>
          </div>
        </div>

        {/* 3. Feedback Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#292126] uppercase tracking-wider">
              3. Your Feedback Message <span className="text-[#E94B83]">*</span>
            </label>
            <span className={`text-[11px] font-mono font-semibold ${message.length > 1900 ? 'text-[#E94B83]' : 'text-slate-400'}`}>
              {message.length} / 2000
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Tell us about your experience, a problem you faced, or something you'd like us to improve..."
            className="w-full p-4 bg-[#FFF8F5] border border-[#F47B8F]/30 rounded-2xl text-xs sm:text-sm text-[#292126] placeholder:text-[#756A70]/60 focus:outline-none focus:ring-2 focus:ring-[#E94B83] focus:bg-white transition-all leading-relaxed font-medium"
            required
          />
        </div>

        {/* 4. Submit Button */}
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="w-full bg-[#E94B83] hover:bg-[#D43770] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl shadow-md shadow-[#E94B83]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

