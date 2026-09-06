import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold">Contact & Grievance Redressal</h1>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>Have questions, safety concerns, or grievances? Contact our compliance team:</p>
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-slate-900 block">Grievance Officer:</span>
            <span>Email: support@companion.com</span>
            <span className="block">Address: Companion Social Platforms Pvt Ltd, Bandra Kurla Complex, Mumbai, Maharashtra 400051</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

