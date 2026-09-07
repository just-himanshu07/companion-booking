import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  CompanionDiscoverySection,
  HowItWorksSection,
  FAQSection,
  HashScrollHandler,
} from '@/components/LandingPageClient';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Sparkles, Search, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore Platform & Discover Companions — Paireva',
  description: 'Explore verified companions, how platform bookings work, and platform FAQs on Paireva.',
};

export default async function ExplorePage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login?redirectTo=/explore');
  }

  // Automatic gender filter preference for logged-in customer
  const genderWhereClause: any = { verificationStatus: 'VERIFIED' };
  if (currentUser?.customerProfile?.gender) {
    const custGender = currentUser.customerProfile.gender.toLowerCase();
    if (custGender === 'male') {
      genderWhereClause.gender = { equals: 'Female', mode: 'insensitive' };
    } else if (custGender === 'female') {
      genderWhereClause.gender = { equals: 'Male', mode: 'insensitive' };
    }
  }

  const featuredCompanions = await prisma.companionProfile.findMany({
    where: genderWhereClause,
    take: 6,
    orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
    select: {
      id: true,
      username: true,
      displayName: true,
      age: true,
      gender: true,
      hourlyPrice: true,
      profilePhoto: true,
      verificationStatus: true,
      averageRating: true,
      totalReviews: true,
      city: { select: { name: true } },
      activities: { select: { activity: { select: { name: true } } } },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />
      <HashScrollHandler />

      <main className="flex-1 w-full">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-b from-white to-[#FFF0F3]/50 border-b border-[#F47B8F]/20 py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#E94B83]" />
                  <span>Authenticated Customer Guide</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#292126] tracking-tight">
                  Explore &amp; Discover Paireva
                </h1>
                <p className="text-sm sm:text-base text-[#756A70] font-medium leading-relaxed">
                  Discover verified companions, learn how social companionship bookings work, and get answers to platform questions.
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

        {/* Section 1: Discover */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
          <div className="bg-white border border-[#F47B8F]/25 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="max-w-3xl mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#292126] tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E94B83]" />
                What You Can Discover on Paireva
              </h2>
              <p className="text-xs sm:text-sm text-[#756A70] font-medium mt-1">
                Everything you need to find and book your ideal social companion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/20 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-xs font-extrabold text-[#292126]">Browse Companions</h3>
                <p className="text-[11px] text-[#756A70] font-medium leading-relaxed">
                  Browse available companions across cities, categories, and preferences.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/20 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-xs font-extrabold text-[#292126]">View Profiles</h3>
                <p className="text-[11px] text-[#756A70] font-medium leading-relaxed">
                  View companion photo galleries, bios, ratings, and verified background details.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/20 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-xs font-extrabold text-[#292126]">Check Details</h3>
                <p className="text-[11px] text-[#756A70] font-medium leading-relaxed">
                  Check availability schedules, hourly pricing rates, and social activities.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/20 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h3 className="text-xs font-extrabold text-[#292126]">Choose Companion</h3>
                <p className="text-[11px] text-[#756A70] font-medium leading-relaxed">
                  Choose a companion based on your personal social preferences and dates.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/20 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <h3 className="text-xs font-extrabold text-[#292126]">Proceed to Booking</h3>
                <p className="text-[11px] text-[#756A70] font-medium leading-relaxed">
                  Proceed to instant booking with transparent rates and safe Razorpay payments.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F47B8F]/20 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-[#756A70] font-medium">
                Ready to find your companion? Explore full profiles and book directly.
              </p>
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

        <CompanionDiscoverySection initialCompanions={featuredCompanions} isLoggedIn={true} />

        {/* Section 2: How It Works */}
        <HowItWorksSection />

        {/* Section 3: FAQs */}
        <FAQSection />

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
              Browse companion profiles by city, hourly rates, and interests.
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

