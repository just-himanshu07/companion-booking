'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Users, Sparkles, Calendar, CreditCard, Flag } from 'lucide-react';

interface AdminGlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
}

export default function AdminGlobalSearchModal({ open, onClose, onSelectTab }: AdminGlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const openSearch = () => {
    // Handled via parent
  };

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
      }
    } catch {
      // Ignore search error
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-brand-600">
            <Search className="w-5 h-5" />
            <span className="font-extrabold text-slate-900 text-sm">Global System Search</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="text"
          autoFocus
          placeholder="Type user email, companion username, booking #, payment ID, or report reason..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {loading && <div className="text-center py-6 text-xs text-slate-400">Searching system database...</div>}

        {results && (
          <div className="max-h-96 overflow-y-auto space-y-4 pt-2 text-xs">
            {/* Users */}
            {results.users?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Users className="w-3 h-3" /> Users ({results.users.length})
                </span>
                {results.users.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSelectTab('USERS');
                      onClose();
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-brand-50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{u.customerProfile?.name || u.email}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{u.email} ({u.role})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{u.accountStatus}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Companions */}
            {results.companions?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Companions ({results.companions.length})
                </span>
                {results.companions.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectTab('COMPANIONS');
                      onClose();
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{c.displayName}</span>
                      <span className="text-[10px] text-purple-600 font-mono">@{c.username} ({c.city?.name})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{c.verificationStatus}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings */}
            {results.bookings?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Bookings ({results.bookings.length})
                </span>
                {results.bookings.map((b: any) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onSelectTab('BOOKINGS');
                      onClose();
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Booking #{b.bookingNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{b.customer.email} → {b.companion.displayName}</span>
                    </div>
                    <span className="font-bold text-emerald-600">₹{b.totalAmount}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payments */}
            {results.payments?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Payments ({results.payments.length})
                </span>
                {results.payments.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectTab('PAYMENTS');
                      onClose();
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{p.paymentNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.user.email} ({p.paymentType})</span>
                    </div>
                    <span className="font-bold text-emerald-600">₹{p.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

