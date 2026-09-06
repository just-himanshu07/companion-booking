import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold">Refund Policy</h1>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>Refunds are processed automatically through Razorpay back to the original source (UPI/Card/Netbanking) within 5-7 business days.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

