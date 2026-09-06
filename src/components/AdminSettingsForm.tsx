'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminSettingsForm({ initialSettings }: { initialSettings: { registrationFee: number; commissionPercent: number } }) {
  const [fee, setFee] = useState(initialSettings.registrationFee);
  const [commission, setCommission] = useState(initialSettings.commissionPercent);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationFee: fee, commissionPercent: commission }),
      });

      if (res.ok) {
        alert('Platform settings updated successfully!');
        window.location.reload();
      } else {
        alert('Failed to update settings');
      }
    } catch (err) {
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Customer Registration Fee (₹)</label>
        <input
          type="number"
          value={fee}
          onChange={(e) => setFee(parseFloat(e.target.value))}
          className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200"
        />
        <span className="text-[10px] text-slate-400">One-time fee charged to new customers</span>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Platform Commission Rate (%)</label>
        <input
          type="number"
          min="0"
          max="50"
          value={commission}
          onChange={(e) => setCommission(parseFloat(e.target.value))}
          className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200"
        />
        <span className="text-[10px] text-slate-400">Commission deducted from booking total</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}

