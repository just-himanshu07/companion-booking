import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionCard from '@/components/CompanionCard';
import { CompanionDiscoverySection, FAQSection, HowItWorksSection, StickyMobileCTA } from '@/components/LandingPageClient';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Search, MapPin, Sparkles, Coffee, Heart, Lock, Calendar, CheckCircle2, UserCheck, ArrowRight, MessageSquare, Star } from 'lucide-react';

export default async function HomePage() {
  const currentUser = await getSessionUser();

  if (currentUser?.role === 'COMPANION') {
    redirect('/companion-dashboard');
  }

  // Automatic opposite gender filter for logged-in customer
  const genderWhereClause: any = { verificationStatus: 'VERIFIED' };
  if (currentUser?.customerProfile?.gender) {
    const custGender = currentUser.customerProfile.gender.toLowerCase();
    if (custGender === 'male') {
      genderWhereClause.gender = { equals: 'Female', mode: 'insensitive' };
    } else if (custGender === 'female') {
      genderWhereClause.gender = { equals: 'Male', mode: 'insensitive' };
    }
  }

  const [featuredCompanions, popularCities, activities, userRecentBookings] = await Promise.all([
    prisma.companionProfile.findMany({
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
    }),
    prisma.city.findMany({
      where: { isPopular: true },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        isPopular: true,
      },
    }),
    prisma.activity.findMany({
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        category: true,
      },
    }),
    currentUser
      ? prisma.booking.findMany({
          where: { customerId: currentUser.id },
          take: 2,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            date: true,
            startTime: true,
            durationHours: true,
            totalAmount: true,
            companion: { select: { displayName: true, profilePhoto: true } },
            activity: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const genderPreferenceHeading =
    currentUser?.customerProfile?.gender?.toLowerCase() === 'male'
      ? 'Female Candidates for You (Rent Girlfriend)'
      : currentUser?.customerProfile?.gender?.toLowerCase() === 'female'
      ? 'Male Candidates for You (Rent Boyfriend)'
      : 'Featured Verified Companions';

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      {/* ========================================================================= */}
      {/* 1. LOGGED-IN VIEW: CUSTOMER WORKSPACE & MATCHING                          */}
      {/* ========================================================================= */}
      {currentUser ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
          {/* WELCOME HEADER & QUICK SHORTCUTS */}
          <div className="bg-white border border-[#F47B8F]/30 p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FFF0F3] rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Opposite-Gender Match Active ({currentUser.customerProfile?.gender || 'Member'})</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                Welcome to Paireva, <span className="text-[#6D315D] font-serif italic">{currentUser.customerProfile?.name || 'Member'}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-[#756A70] mt-1 font-medium">
                Discover verified companion profiles available by the hour in your city.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <Link
                href="/profile?tab=bookings"
                className="bg-[#FFF0F3] hover:bg-[#FFE4E8] text-[#6D315D] font-extrabold text-xs px-5 py-3 rounded-xl border border-[#F47B8F]/30 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#E94B83]" /> My Bookings
              </Link>
              <Link
                href="/become-a-companion"
                className="bg-white hover:bg-[#FFF0F3] text-[#6D315D] font-extrabold text-xs px-4 py-3 rounded-xl border border-[#F47B8F]/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#E94B83]" /> Become Companion
              </Link>
              <Link
                href="/messages"
                className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>
            </div>
          </div>

          {/* QUICK HOW-IT-WORKS INFO FOR LOGGED-IN USERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 flex items-center justify-center font-extrabold text-xs shrink-0">1</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Opposite Gender Match</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Male members see female companions; female members see male companions.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] border border-[#F47B8F]/30 flex items-center justify-center font-extrabold text-xs shrink-0">2</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Public Social Activities</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Book for fine dining, movies, concerts, sightseeing, and public events.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-extrabold text-xs shrink-0">3</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Verified & Safe</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">100% photo ID verified companions. Phone & email masked in chat.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6D315D] border border-purple-200 flex items-center justify-center font-extrabold text-xs shrink-0">4</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Strictly Non-Sexual</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Social companionship only. Zero tolerance for harassment or illegal activity.</p>
              </div>
            </div>
          </div>

          {/* ACTIVE BOOKINGS PREVIEW (IF ANY) */}
          {userRecentBookings.length > 0 && (
            <div className="bg-gradient-to-r from-[#FFF0F3] via-white to-[#FFF8F5] border border-[#F47B8F]/30 p-6 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E94B83]">Upcoming Active Booking</span>
                <Link href="/profile?tab=bookings" className="text-xs text-[#6D315D] font-bold hover:underline flex items-center gap-1">
                  View All →
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-extrabold text-[#292126]">
                    {userRecentBookings[0].activity.name} with {userRecentBookings[0].companion.displayName}
                  </h4>
                  <p className="text-xs text-[#756A70] mt-0.5">
                    Date: {userRecentBookings[0].date} at {userRecentBookings[0].startTime} ({userRecentBookings[0].durationHours} hrs)
                  </p>
                </div>
                <Link
                  href="/messages"
                  className="bg-[#6D315D] text-white hover:bg-[#58264A] font-bold text-xs px-4 py-2 rounded-xl shrink-0 transition-colors"
                >
                  Open Chat
                </Link>
              </div>
            </div>
          )}

          {/* COMPANION SEARCH & DISCOVERY WORKSPACE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F47B8F]/20 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-[#F47B8F]/20 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#292126]">Find Your Social Companion</h2>
                <p className="text-xs text-[#756A70] mt-0.5 font-medium">Filter by city or activity</p>
              </div>
              <Link href="/companions" className="text-xs font-bold text-[#E94B83] hover:underline">
                Open Directory & Filters →
              </Link>
            </div>

            {/* Quick Filter Form */}
            <form action="/companions" method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#756A70]" />
                <select
                  name="city"
                  className="w-full pl-10 pr-4 py-3 bg-[#FFF8F5] text-[#292126] text-xs font-bold rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83] appearance-none"
                >
                  <option value="">All Cities</option>
                  {popularCities.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-[#756A70]" />
                <select
                  name="activity"
                  className="w-full pl-10 pr-4 py-3 bg-[#FFF8F5] text-[#292126] text-xs font-bold rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83] appearance-none"
                >
                  <option value="">All Activities</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.slug}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" /> Search Candidates
              </button>
            </form>
          </div>

          {/* FEATURED VERIFIED COMPANIONS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#292126]">{genderPreferenceHeading}</h2>
              <Link href="/companions" className="text-xs font-bold text-[#E94B83] hover:underline">
                View All Candidates ({featuredCompanions.length}+)
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCompanions.map((comp) => (
                <CompanionCard key={comp.id} companion={comp} />
              ))}
            </div>
          </div>

          {/* SAFETY FOOTER LINK */}
          <div className="p-4 bg-white rounded-2xl text-center text-xs text-[#756A70] flex flex-wrap items-center justify-center gap-4 border border-[#F47B8F]/20 shadow-sm font-medium">
            <Link href="/safety" className="hover:text-[#6D315D] flex items-center gap-1 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Safety Center
            </Link>
            <span>•</span>
            <Link href="/prohibited-services" className="hover:text-[#6D315D]">
              Prohibited Services Policy
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#6D315D]">
              Contact Support
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. LOGGED-OUT VIEW: PAIREVA WARM ROMANTIC LUXURY BRANDING                 */
        /* ========================================================================= */
        <>
          {/* ==================== 1. HERO SECTION ==================== */}
          <section className="relative py-16 lg:py-24 bg-[#FFF8F5] overflow-hidden border-b border-[#F47B8F]/20">
            {/* Ambient Warm Gradients */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#FFD8C8]/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-[#F6A6B8]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* LEFT COLUMN: HERO COPY & CTAS */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  {/* Eyebrow Pill */}
                  <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm">
                    <Sparkles className="w-4 h-4 text-[#E94B83]" />
                    <span>REAL PEOPLE. REAL COMPANY.</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#292126] tracking-tight leading-[1.15]">
                    Rent a <span className="font-serif italic text-[#6D315D]">Girlfriend</span>.<br />
                    Rent a <span className="font-serif italic text-[#E94B83]">Boyfriend</span>.<br />
                    Or just <span className="font-serif italic text-[#F47B8F]">Some Company</span>.
                  </h1>

                  {/* Supporting Copy */}
                  <p className="text-base sm:text-lg text-[#756A70] leading-relaxed max-w-xl font-medium">
                    Looking for someone to talk to, grab coffee with, attend an event with, or simply spend time with? Discover companions available by the hour.
                  </p>

                  {/* Primary & Secondary CTAs */}
                  <div className="space-y-2 pt-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Link
                        href="/companions"
                        className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-[#E94B83]/25 transition-all hover:scale-[1.02] text-base text-center inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        Find Your Companion →
                      </Link>
                      <Link
                        href="/become-a-companion"
                        className="bg-white hover:bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/40 font-extrabold px-7 py-4 rounded-2xl shadow-sm transition-all hover:scale-[1.01] text-base text-center inline-flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        Become a Companion →
                      </Link>
                    </div>

                    {/* Small Supporting Text for Companion CTA */}
                    <p className="text-xs text-[#756A70] font-semibold pl-1">
                      Want to offer companionship? Join Paireva.
                    </p>
                  </div>

                  {/* Pricing Badge & Microcopy Disclaimer */}
                  <div className="pt-2">
                    <div className="inline-block bg-white border border-[#F47B8F]/30 p-4 rounded-2xl shadow-sm max-w-lg">
                      <span className="text-xs font-black text-[#6D315D] uppercase tracking-wider block">
                        ₹399 One-Time Platform Registration
                      </span>
                      <span className="text-[11px] text-[#756A70] block mt-1 leading-snug font-medium">
                        Platform registration fee. Companion/booking charges, where applicable, are separate.
                      </span>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-wrap items-center gap-5 text-xs font-bold text-[#6D315D] pt-2">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#F47B8F]/25 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verified Profiles</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#F47B8F]/25 shadow-sm">
                      <Lock className="w-4 h-4 text-[#E94B83]" />
                      <span>Private & Discreet</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#F47B8F]/25 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-[#D9A85C]" />
                      <span>Secure Platform</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: HIGH-QUALITY LIFESTYLE PHOTOGRAPH */}
                <div className="lg:col-span-5 relative">
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"
                      alt="Young Adult Indian Couple Coffee Date Experience"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#292126]/60 via-transparent to-transparent" />

                    {/* Floating Accent Card */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#F47B8F]/30 shadow-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#E94B83] uppercase tracking-wider block">Verified Companion</span>
                        <h4 className="text-sm font-extrabold text-[#292126]">Warm Coffee & Real Conversations</h4>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>4.9</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 2. EMOTIONAL BRAND SECTION ==================== */}
          <section className="py-20 bg-[#FFF0F3] border-b border-[#F47B8F]/20 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Photo */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white group">
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
                    alt="Rooftop Date Shared Moment"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6D315D]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-5 bg-white/90 rounded-2xl backdrop-blur-md border border-[#F47B8F]/30 shadow-lg">
                    <p className="text-xs font-extrabold text-[#E94B83] uppercase tracking-widest">Meaningful Moments</p>
                    <h4 className="text-base font-extrabold text-[#292126] mt-0.5">Someone to Share the Moment With</h4>
                  </div>
                </div>

                {/* Right Copy */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                      <span className="font-serif italic text-[#6D315D]">Good Company</span> Changes Everything.
                    </h2>
                    <p className="text-[#6D315D] font-serif text-xl sm:text-2xl mt-4 leading-relaxed italic">
                      "Sometimes you don't need a relationship. You just want someone to share the moment with."
                    </p>
                    <div className="w-20 h-1 bg-[#E94B83] rounded-full mt-3" />
                  </div>

                  <p className="text-sm sm:text-base text-[#756A70] leading-relaxed font-medium">
                    Coffee. Conversations. Events. A little company when you want it. Paireva provides a safe, discreet marketplace to discover like-minded companions available by the hour.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 3. EXPERIENCE CARDS ==================== */}
          <section className="py-20 bg-[#FFF8F5] border-b border-[#F47B8F]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full mb-3">
                  <Heart className="w-3.5 h-3.5 text-[#E94B83] fill-[#E94B83]" />
                  <span>Paireva Experiences</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                  Sometimes You Just Want <span className="font-serif text-[#6D315D] italic">Good Company</span>.
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* CARD 1 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    ☕
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Coffee Dates</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Grab coffee. Talk. Laugh. Enjoy the moment.
                  </p>
                </div>

                {/* CARD 2 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    🥂
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Event Companion</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Have someone by your side for your next event.
                  </p>
                </div>

                {/* CARD 3 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    💬
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Conversations</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Sometimes you simply want someone to talk to.
                  </p>
                </div>

                {/* CARD 4 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    ❤️
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Shared Moments</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Spend time together doing something you enjoy.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 4. COMPANION DISCOVERY ==================== */}
          <CompanionDiscoverySection
            initialCompanions={
              currentUser
                ? featuredCompanions
                : featuredCompanions.map((comp) => ({
                    ...comp,
                    displayName: '••••••',
                    bio: 'Register or log in to view full profile details and bio.',
                    city: { name: 'City hidden' },
                    username: 'locked',
                  }))
            }
            isLoggedIn={!!currentUser}
          />

          {/* ==================== 5. HOW IT WORKS ==================== */}
          <HowItWorksSection />

          {/* ==================== 6. PREMIUM CINEMATIC BREAK ==================== */}
          <section className="relative py-28 bg-[#6D315D] text-white overflow-hidden border-b border-[#F47B8F]/20">
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1920&q=80"
                alt="City Sunset Romantic Scene"
                className="w-full h-full object-cover filter brightness-[0.4]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#6D315D]/90 via-[#6D315D]/80 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-xl space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-rose-200 text-xs font-bold px-3.5 py-1 rounded-full backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#E94B83]" />
                  <span>Cinematic Companionship</span>
                </div>

                <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  <span className="font-serif italic font-normal">Life is better</span><br />
                  when shared.
                </h2>

                <p className="text-base text-rose-100/90 leading-relaxed font-medium">
                  Find someone to laugh with. Talk with. Go somewhere with. Simply spend time with.
                </p>

                <div>
                  <Link
                    href="/companions"
                    className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2 text-sm cursor-pointer"
                  >
                    Find Your Companion →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 7. TRUST SECTION ==================== */}
          <section className="py-20 bg-[#FFF8F5] border-b border-[#F47B8F]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                  Built Around Trust.
                </h2>
                <p className="text-[#756A70] text-sm mt-2 font-medium">Safety, verification, and privacy built into every step</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* TRUST 1 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center font-bold">🔒</div>
                  <h3 className="text-base font-extrabold text-[#292126]">Privacy First</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Your personal information should stay personal.
                  </p>
                </div>

                {/* TRUST 2 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-2xl flex items-center justify-center font-bold">✓</div>
                  <h3 className="text-base font-extrabold text-[#292126]">Verified Profiles</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Verification indicators help you make informed choices.
                  </p>
                </div>

                {/* TRUST 3 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-2xl flex items-center justify-center font-bold">💳</div>
                  <h3 className="text-base font-extrabold text-[#292126]">Secure Payments</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Use a secure payment experience on the platform.
                  </p>
                </div>

                {/* TRUST 4 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center font-bold">🛡️</div>
                  <h3 className="text-base font-extrabold text-[#292126]">Clear Experiences</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Know what you're booking before you confirm.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 8. ₹399 REGISTRATION SECTION ==================== */}
          <section className="py-20 bg-[#FFF0F3] border-b border-[#F47B8F]/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full mb-3 shadow-sm">
                  <span>Transparent Pricing</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                  Start Your Paireva Journey
                </h2>
              </div>

              {/* Pricing Card */}
              <div className="bg-white border border-[#F47B8F]/30 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
                <div className="space-y-6 max-w-md mx-auto">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#756A70] block">One-Time Platform Fee</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl sm:text-6xl font-black text-[#6D315D]">₹399</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#E94B83] block">One-Time Platform Registration</span>

                  <div className="space-y-3 text-xs text-[#292126] text-left pt-4 border-t border-slate-100 font-bold">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>One-time platform registration</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No monthly subscription</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Access to the Paireva platform</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Discover available companions</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/register"
                      className="w-full bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-sm py-4 px-8 rounded-2xl shadow-lg transition-all inline-block hover:scale-[1.02] cursor-pointer"
                    >
                      Register for ₹399 →
                    </Link>
                  </div>

                  <p className="text-[11px] text-[#756A70] leading-relaxed border-t border-slate-100 pt-4 font-medium">
                    Important: ₹399 is the platform registration fee. Companion or booking charges, where applicable, are separate.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 9. SOCIAL PROOF ==================== */}
          <section className="py-20 bg-[#FFF8F5] border-b border-[#F47B8F]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                  Your next great experience starts with <span className="font-serif text-[#6D315D] italic">finding the right company</span>.
                </h2>
                <p className="text-sm text-[#756A70] mt-3 font-medium">
                  Designed for authentic human connection in safe public settings across India.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center font-bold mx-auto">🤝</div>
                  <h4 className="text-sm font-extrabold text-[#292126]">Public Outings Only</h4>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Every date and meeting takes place safely in public restaurants, cafes, and event spaces.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0F3] text-[#E94B83] flex items-center justify-center font-bold mx-auto">✨</div>
                  <h4 className="text-sm font-extrabold text-[#292126]">Verified Identities</h4>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Govt photo ID verification checks keep the community authentic and safe.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0F3] text-[#D9A85C] flex items-center justify-center font-bold mx-auto">🔒</div>
                  <h4 className="text-sm font-extrabold text-[#292126]">Full Discretion</h4>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Complete privacy protection and masked contact details during in-app messaging.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 10. FAQ ACCORDION ==================== */}
          <FAQSection />

          {/* ==================== 11. FINAL CTA BANNER ==================== */}
          <section className="relative py-24 bg-[#6D315D] text-white text-center overflow-hidden border-b border-[#F47B8F]/20">
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1920&q=80"
                alt="Romantic Shared Moment"
                className="w-full h-full object-cover filter brightness-[0.35]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#6D315D]/90 via-[#6D315D]/80 to-[#6D315D]/90" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                <span className="font-serif italic font-normal">Don't Just Make Plans.</span><br />
                Make Moments.
              </h2>

              <p className="text-rose-100/90 text-base sm:text-lg max-w-xl mx-auto font-medium">
                Find someone to talk to. Find someone to laugh with. Find someone to share an experience with.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/companions"
                  className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-base px-10 py-5 rounded-2xl shadow-2xl transition-all inline-block hover:scale-105 cursor-pointer"
                >
                  Find Your Companion →
                </Link>
                <Link
                  href="/become-a-companion"
                  className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-base px-8 py-5 rounded-2xl border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                >
                  Become a Companion →
                </Link>
              </div>

              <p className="text-xs text-rose-200 font-extrabold uppercase tracking-wider">
                One-Time Platform Registration: ₹399
              </p>
            </div>
          </section>

          {/* STICKY MOBILE CTA BAR */}
          <StickyMobileCTA />
        </>
      )}

      <Footer />
    </div>
  );
}
