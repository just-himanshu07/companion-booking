import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>We respect your privacy. All personal data, identity documents, and communication remain encrypted and confidential.</p>
          <h3 className="font-bold text-sm text-slate-900">Contact Info Privacy Guard</h3>
          <p>Phone numbers, email addresses, and private government ID documents are never publicly disclosed or sold to third parties.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

