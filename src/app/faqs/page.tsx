import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FAQSection } from '@/components/LandingPageClient';
import { getSessionUser } from '@/lib/auth';
import { Sparkles, Search, ShieldCheck, ArrowRight, HelpCircle, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Paireva',
  description: 'Find answers to common questions about Paireva registration, companion bookings, safety policies, and payments.',
};

export default async function FAQsPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login?redirectTo=/faqs');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="flex-1 w-full">
        {/* Header Banner */}
        <div className="bg-gradient-to-b from-white to-[#FFF0F3]/50 border-b border-[#F47B8F]/20 py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-sm">
                  <HelpCircle className="w-3.5 h-3.5 text-[#E94B83]" />
                  <span>Customer Support &amp; Information</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#292126] tracking-tight">
                  Frequently Asked Questions
                </h1>
                <p className="text-sm sm:text-base text-[#756A70] font-medium leading-relaxed">
                  Clear, transparent answers about platform registration, companion bookings, safety standards, and Razorpay payments.
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

        {/* Core Accordion FAQ Section */}
        <FAQSection />

        {/* Support & Legal Links Box */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
          <div className="bg-white border border-[#F47B8F]/25 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-4">
            <h3 className="text-lg font-extrabold text-[#292126]">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-[#756A70] font-medium max-w-xl mx-auto">
              Our safety guidelines, community rules, and support team are available to ensure a seamless experience.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <Link
                href="/safety"
                className="bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] hover:bg-[#F47B8F]/20 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all"
              >
                Safety Center
              </Link>
              <Link
                href="/terms"
                className="bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] hover:bg-[#F47B8F]/20 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all"
              >
                Terms &amp; Conditions
              </Link>
              <Link
                href="/contact"
                className="bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] hover:bg-[#F47B8F]/20 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all"
              >
                Contact Support
              </Link>
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
              Find verified companions in your city for dining, coffee, and events.
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

