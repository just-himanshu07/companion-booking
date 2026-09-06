'use client';

import React, { useState } from 'react';
import { Flag, X, AlertTriangle } from 'lucide-react';

export default function ReportButton({ reportedUserId }: { reportedUserId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('Inappropriate Behavior');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedUserId, reason, description }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        alert('Failed to submit report. Please make sure you are logged in.');
      }
    } catch (err) {
      alert('Error submitting report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rosebrand-600 hover:text-rosebrand-700 bg-rosebrand-50 px-3 py-1.5 rounded-full border border-rosebrand-200 transition-colors"
        title="Report Profile"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-rosebrand-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              Report User / Violation
            </div>

            {success ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl text-center">
                Report submitted successfully. Our safety compliance team is reviewing it.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Report</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200"
                  >
                    <option value="Sexual Solicitation / Escorting Request">Sexual Solicitation / Escorting Request</option>
                    <option value="Harassment or Inappropriate Conduct">Harassment or Inappropriate Conduct</option>
                    <option value="Fake Profile or Impersonation">Fake Profile or Impersonation</option>
                    <option value="Payment Fraud / Scam">Payment Fraud / Scam</option>
                    <option value="Prohibited Services Violation">Prohibited Services Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Incident</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Provide details about the incident..."
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rosebrand-600 hover:bg-rosebrand-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

