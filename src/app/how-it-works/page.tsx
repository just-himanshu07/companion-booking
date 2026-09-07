import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HowItWorksSection } from '@/components/LandingPageClient';
import { getSessionUser } from '@/lib/auth';
import { Sparkles, Search, ShieldCheck, ArrowRight, CheckCircle2, Lock, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — Paireva Social Companionship',
  description: 'Learn how to register, discover verified companions, select experiences, and book social dates on Paireva.',
};

export default async function HowItWorksPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login?redirectTo=/how-it-works');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="flex-1 w-full">
        {/* Page Banner Header */}
        <div className="bg-gradient-to-b from-white to-[#FFF0F3]/50 border-b border-[#F47B8F]/20 py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#E94B83]" />
                  <span>Platform Process &amp; Guidelines</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#292126] tracking-tight">
                  How Paireva Works
                </h1>
                <p className="text-sm sm:text-base text-[#756A70] font-medium leading-relaxed">
                  A simple, transparent 4-step journey to connecting with verified social companions safely in your city.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link
                  href="/companions"
                  className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md shadow-[#E94B83]/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Discover Companions →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Core Step-by-Step Component */}
        <HowItWorksSection />

        {/* Platform Standards & Safety Information */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="bg-white border border-[#F47B8F]/25 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <div className="max-w-3xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E94B83] block mb-1">
                Guaranteed Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292126] tracking-tight">
                Safety &amp; Transparency Safeguards
              </h2>
              <p className="text-xs sm:text-sm text-[#756A70] font-medium mt-1">
                Paireva maintains high safety and verification standards for every booking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FFF8F5] p-6 rounded-2xl border border-[#F47B8F]/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#292126]">100% Photo ID Verified Profiles</h3>
                <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                  Every companion profile undergoes strict government photo ID verification before receiving the Verified Profile badge.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-6 rounded-2xl border border-[#F47B8F]/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-extrabold text-[#292126]">Public Venue Policy</h3>
                <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                  All companion meetings strictly take place in public social venues such as cafes, restaurants, theaters, or events.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-6 rounded-2xl border border-[#F47B8F]/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5 text-[#6D315D]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#292126]">Secure Razorpay Payments</h3>
                <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                  Payments are processed via encrypted Razorpay checkout with clear pricing breakdowns and zero hidden charges.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#F47B8F]/20 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs sm:text-sm text-[#756A70] font-medium">
                Have questions about booking or companion policies? Check out our FAQs or browse available companions.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/faqs"
                  className="bg-white border border-[#F47B8F]/30 text-[#6D315D] hover:bg-[#FFF0F3] text-xs font-extrabold px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  View FAQs
                </Link>
                <Link
                  href="/companions"
                  className="bg-[#E94B83] hover:bg-[#D43770] text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md shadow-[#E94B83]/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Discover Companions →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-tr from-[#6D315D] to-[#E94B83] text-white py-16 px-4 sm:px-6 lg:px-8 text-center border-t border-[#F47B8F]/20">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-rose-100 text-xs font-extrabold px-3.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Public Social Companionship</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Connect with Verified Companions?
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 max-w-xl mx-auto font-medium">
              Start your companion search today and book verified social experiences.
            </p>
            <div className="pt-2">
              <Link
                href="/companions"
                className="inline-flex items-center gap-2 bg-white text-[#6D315D] hover:bg-rose-50 font-extrabold text-xs px-7 py-3.5 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Discover Companions <ArrowRight className="w-4 h-4 text-[#E94B83]" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

