import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold">Cancellation & Refund Policy</h1>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <h3 className="font-bold text-sm text-slate-900">Customer Cancellation</h3>
          <p>Cancellations made 24 hours prior to booking start time receive a 100% refund. Cancellations within 24 hours are subject to a 20% processing fee.</p>
          <h3 className="font-bold text-sm text-slate-900">Companion Cancellation</h3>
          <p>If a companion cancels a confirmed booking, the customer receives an automatic 100% refund immediately via Razorpay.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

