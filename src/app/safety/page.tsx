import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { ShieldCheck, Lock, AlertTriangle, PhoneCall, UserCheck, Eye } from 'lucide-react';

export default async function SafetyCenterPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      {/* HERO BANNER */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Companion Trust & Safety Center</h1>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Your safety and authentic human connection are our top priorities. Learn about our strict verification rules and code of conduct.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 w-full flex-1 space-y-10">
        {/* NON-SEXUAL DISCLAIMER */}
        <div className="bg-rosebrand-50 border-2 border-rosebrand-200 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-rosebrand-700 font-extrabold text-base">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Strict Non-Sexual & Anti-Prostitution Policy
          </div>
          <p className="text-xs text-rosebrand-900 leading-relaxed">
            Companion is strictly a platform for hiring verified companions for public social activities (dining, movies, cultural events, concerts, sightseeing, business networking). Sexual services, prostitution, solicitation, harassment, and human trafficking are prohibited. Violations lead to immediate lifetime account termination and report to law enforcement agencies.
          </p>
        </div>

        {/* CORE SAFETY PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">1. 100% ID Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every companion must submit official government photo identification (Aadhaar, Passport, Driving License) and selfie verification before appearing publicly in search results.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">2. Meet in Public Venues Only</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All bookings must take place in public social locations (restaurants, cafes, movie theaters, exhibition halls). Never invite companions to private residences or non-public venues.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">3. In-Platform Secure Messaging</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keep all conversation within the platform. Our automatic contact protection masks phone numbers and email addresses to keep your personal data confidential.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">4. 24/7 Report & Emergency Support</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use the Report and Block buttons on any profile or message thread if you experience inappropriate behavior. Our compliance team acts swiftly on all reports.
            </p>
          </div>
        </div>

        {/* EMERGENCY CONTACTS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Emergency & Helpline Numbers (India)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold">National Emergency Number</span>
              <span className="text-base font-black text-slate-900">112</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold">Women Helpline</span>
              <span className="text-base font-black text-slate-900">1091</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold">Cyber Crime Portal</span>
              <span className="text-base font-black text-slate-900">1930</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
