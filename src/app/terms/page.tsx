import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';

export default async function TermsPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />
      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold">Terms & Conditions</h1>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>Welcome to Companion. By using our website and services, you agree to comply with the following terms:</p>
          <h3 className="font-bold text-sm text-slate-900">1. Eligibility (18+ Requirement)</h3>
          <p>You must be at least 18 years of age to register an account or book any companion on our platform.</p>
          <h3 className="font-bold text-sm text-slate-900">2. Social Activities Scope</h3>
          <p>Services offered through this platform are strictly for legitimate social accompaniment in public venues (dining, movies, concerts, sightseeing). Sexual services and illegal acts are strictly prohibited.</p>
          <h3 className="font-bold text-sm text-slate-900">3. Fees & Payments</h3>
          <p>Customers must pay a one-time non-refundable ₹149 registration fee. Booking payments are securely held until service completion.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
