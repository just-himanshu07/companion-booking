'use client';

import React, { useState } from 'react';
import { ShieldCheck, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function AdminCompanionControls({ companions }: { companions: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateStatus = async (companionId: string, verificationStatus: string) => {
    const reason = prompt(`Enter reason or notes for status update to ${verificationStatus}:`) || '';
    setLoadingId(companionId);

    try {
      const res = await fetch('/api/admin/companions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionId, verificationStatus, reason }),
      });

      if (res.ok) {
        alert(`Companion status updated to ${verificationStatus}`);
        window.location.reload();
      } else {
        alert('Status update failed');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
          <tr>
            <th className="p-3">Companion Name</th>
            <th className="p-3">City</th>
            <th className="p-3">Hourly Rate</th>
            <th className="p-3">Verification Docs</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {companions.map((comp) => (
            <tr key={comp.id} className="hover:bg-slate-50">
              <td className="p-3 font-bold text-slate-900">
                {comp.displayName} ({comp.fullName})
                <span className="block text-[10px] text-slate-400 font-normal">{comp.user.email}</span>
              </td>
              <td className="p-3">{comp.city?.name}</td>
              <td className="p-3 font-bold text-slate-900">₹{comp.hourlyPrice}/hr</td>
              <td className="p-3">
                {comp.verificationDocs.length > 0 ? (
                  comp.verificationDocs.map((d: any) => (
                    <a
                      key={d.id}
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 font-semibold underline block text-[11px]"
                    >
                      View {d.documentType}
                    </a>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No docs</span>
                )}
              </td>
              <td className="p-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    comp.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : comp.verificationStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rosebrand-100 text-rosebrand-800'
                  }`}
                >
                  {comp.verificationStatus}
                </span>
              </td>
              <td className="p-3 text-right space-x-1">
                {comp.verificationStatus !== 'VERIFIED' && (
                  <button
                    onClick={() => updateStatus(comp.id, 'VERIFIED')}
                    disabled={loadingId === comp.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                  >
                    Approve / Verify
                  </button>
                )}

                {comp.verificationStatus !== 'REJECTED' && (
                  <button
                    onClick={() => updateStatus(comp.id, 'REJECTED')}
                    disabled={loadingId === comp.id}
                    className="bg-rosebrand-600 hover:bg-rosebrand-700 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                  >
                    Reject
                  </button>
                )}

                {comp.verificationStatus !== 'BANNED' && (
                  <button
                    onClick={() => updateStatus(comp.id, 'BANNED')}
                    disabled={loadingId === comp.id}
                    className="bg-slate-900 hover:bg-black text-white font-bold px-2.5 py-1 rounded text-[11px]"
                  >
                    Ban User
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

