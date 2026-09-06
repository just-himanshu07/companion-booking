'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DocumentUploadForm({ companionId, existingDocs }: { companionId: string; existingDocs: any[] }) {
  const [fileUrl, setFileUrl] = useState('');
  const [docType, setDocType] = useState('GOVT_ID');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;

    setUploading(true);
    try {
      const res = await fetch('/api/companions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionId, documentType: docType, fileUrl }),
      });

      if (res.ok) {
        alert('Document uploaded for verification review!');
        window.location.reload();
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      alert('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {existingDocs.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">Uploaded Verification Documents:</span>
          {existingDocs.map((d) => (
            <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{d.documentType}</span>
                <span className="block text-[10px] text-slate-500">Status: {d.status}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-3 border-t border-slate-100 pt-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200"
          >
            <option value="GOVT_ID">Government Photo ID (Aadhaar/Passport/Driving License)</option>
            <option value="SELFIE">Selfie Verification</option>
            <option value="ADDRESS_PROOF">Address Proof Document</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Document Image URL / Reference</label>
          <input
            type="url"
            required
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://example.com/id_scan.jpg"
            className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading...' : 'Submit Verification Doc'}
        </button>
      </form>
    </div>
  );
}

