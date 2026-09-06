import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold">Community Guidelines</h1>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>Treat all companions and clients with dignity, punctuality, and respect. Maintain appropriate boundaries at all times during social engagements.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

