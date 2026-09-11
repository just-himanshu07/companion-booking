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
import { ShieldCheck, Search, MapPin, Sparkles, Lock, Calendar, CheckCircle2, MessageSquare, Star } from 'lucide-react';

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
      ? 'Female Companions for You'
      : currentUser?.customerProfile?.gender?.toLowerCase() === 'female'
      ? 'Male Companions for You'
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
                <span>Verified Match Active ({currentUser.customerProfile?.gender || 'Member'})</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                Welcome back, <span className="text-[#6D315D] font-serif italic">{currentUser.customerProfile?.name || 'Member'}</span>
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
                <h4 className="text-xs font-bold text-[#292126]">Verified Companions</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Connect with verified people for genuine social companionship.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] border border-[#F47B8F]/30 flex items-center justify-center font-extrabold text-xs shrink-0">2</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Public Social Activities</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Book for coffee, dining, movies, concerts, sightseeing, and public events.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-extrabold text-xs shrink-0">3</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Verified &amp; Safe</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Photo ID verified companions. Contact details masked during chat.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F47B8F]/20 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6D315D] border border-purple-200 flex items-center justify-center font-extrabold text-xs shrink-0">4</div>
              <div>
                <h4 className="text-xs font-bold text-[#292126]">Strictly Non-Sexual</h4>
                <p className="text-[11px] text-[#756A70] mt-0.5 leading-snug">Social companionship only. Zero tolerance for harassment or illicit services.</p>
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

          {/* COMPANION SEARCH WORKSPACE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F47B8F]/20 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-[#F47B8F]/20 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#292126]">Find Your Companion</h2>
                <p className="text-xs text-[#756A70] mt-0.5 font-medium">Filter by city or activity</p>
              </div>
              <Link href="/companions" className="text-xs font-bold text-[#E94B83] hover:underline">
                Open Directory &amp; Filters →
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
                <Search className="w-4 h-4" /> Search Companions
              </button>
            </form>
          </div>

          {/* FEATURED COMPANIONS GRID */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold text-[#292126]">{genderPreferenceHeading}</h2>
              <Link href="/companions" className="text-xs font-bold text-[#E94B83] hover:underline">
                View All Companions ({featuredCompanions.length}+)
              </Link>
            </div>

            {/* VERIFICATION GATE VISUAL BADGE FOR UNAPPROVED USERS */}
            {currentUser?.role === 'CUSTOMER' && currentUser?.accountStatus !== 'ACTIVE' && (
              <div className="p-4 bg-[#FFF0F3] border border-[#F47B8F]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#6D315D]">
                  <Lock className="w-4 h-4 text-[#E94B83] shrink-0" />
                  <span>Photos Locked — Identity Verification Under Review</span>
                </div>
                <span className="text-[11px] text-[#756A70] font-medium">
                  Photos unlock automatically upon admin verification approval.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(currentUser?.role === 'CUSTOMER' && currentUser?.accountStatus !== 'ACTIVE'
                ? featuredCompanions.map((comp) => ({
                    ...comp,
                    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80&blur=50',
                  }))
                : featuredCompanions
              ).map((comp) => (
                <CompanionCard
                  key={comp.id}
                  companion={comp}
                  isLocked={currentUser?.role === 'CUSTOMER' && currentUser?.accountStatus !== 'ACTIVE'}
                />
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
              Prohibited Activities Policy
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#6D315D]">
              Contact Support
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. LOGGED-OUT VIEW: ELEGANT SOCIAL COMPANIONSHIP MARKETPLACE              */
        /* ========================================================================= */
        <>
          {/* ==================== 1. HERO SECTION ==================== */}
          <section className="relative py-16 lg:py-24 bg-[#FFF8F5] overflow-hidden border-b border-[#F47B8F]/20">
            {/* Ambient Warm Soft Background Glows */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#FFD8C8]/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-[#F6A6B8]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* LEFT COLUMN: HERO COPY & CTAS */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  {/* Eyebrow Pill */}
                  <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm">
                    <Sparkles className="w-4 h-4 text-[#E94B83]" />
                    <span>SOCIAL COMPANIONSHIP MARKETPLACE</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#292126] tracking-tight leading-[1.15]">
                    Find Someone to<br />
                    <span className="font-serif italic text-[#6D315D]">Spend Time With.</span>
                  </h1>

                  {/* Supporting Copy */}
                  <p className="text-base sm:text-lg text-[#756A70] leading-relaxed max-w-xl font-medium">
                    Meet real people for coffee, conversations, events, local activities, or simply some good company. Discover companions available for meaningful, real-world experiences.
                  </p>

                  {/* Primary & Secondary CTAs */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Link
                        href="/companions"
                        className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-[#E94B83]/25 transition-all hover:scale-[1.02] text-base text-center inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        Find a Companion →
                      </Link>
                      <Link
                        href="/become-a-companion"
                        className="bg-white hover:bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/40 font-extrabold px-7 py-4 rounded-2xl shadow-sm transition-all hover:scale-[1.01] text-base text-center inline-flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        Become a Companion →
                      </Link>
                    </div>

                    {/* Trust Line Below CTAs */}
                    <p className="text-xs text-[#756A70] font-semibold flex items-center gap-1.5 pt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Verified profiles • Real-world experiences • Safe &amp; respectful community</span>
                    </p>
                  </div>

                  {/* Pricing Badge & Microcopy Disclaimer */}
                  <div className="pt-2">
                    <div className="inline-block bg-white border border-[#F47B8F]/30 p-4 rounded-2xl shadow-sm max-w-lg">
                      <span className="text-xs font-black text-[#6D315D] uppercase tracking-wider block">
                        ₹399 ONE-TIME PLATFORM REGISTRATION
                      </span>
                      <span className="text-[11px] text-[#756A70] block mt-1 leading-snug font-medium">
                        A one-time ₹399 registration fee is charged to create and activate your Paireva account. This covers account onboarding, profile verification, safety checks, and access to the Paireva platform. Companion booking charges, if applicable, are separate.
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
                      <span>Private &amp; Discreet</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#F47B8F]/25 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-[#D9A85C]" />
                      <span>Secure Platform</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ELEGANT COMPANIONSHIP LIFESTYLE PHOTO */}
                <div className="lg:col-span-5 relative">
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"
                      alt="Coffee date and conversation experience"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#292126]/60 via-transparent to-transparent" />

                    {/* Floating Accent Card */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#F47B8F]/30 shadow-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#E94B83] uppercase tracking-wider block">Real-World Outing</span>
                        <h4 className="text-sm font-extrabold text-[#292126]">Coffee &amp; Good Conversations</h4>
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

          {/* ==================== 2. CLEAR NON-SEXUAL POSITIONING ==================== */}
          <section className="py-12 bg-white border-b border-[#F47B8F]/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Our Core Policy</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292126] tracking-tight">
                Companionship, not anything else.
              </h2>
              <p className="text-sm sm:text-base text-[#756A70] leading-relaxed font-medium max-w-2xl mx-auto">
                Paireva connects people for genuine social companionship — coffee, conversations, public events, walks, local activities and shared experiences.
              </p>
              <p className="text-xs sm:text-sm text-[#6D315D] leading-relaxed font-bold max-w-2xl mx-auto pt-1">
                Paireva is strictly non-sexual. Escorting, prostitution, sexual services and sexual arrangements are prohibited.
              </p>
            </div>
          </section>

          {/* ==================== 3. HOW IT WORKS ==================== */}
          <HowItWorksSection />

          {/* ==================== 4. WHAT YOU CAN DO (SHARED EXPERIENCES GRID) ==================== */}
          <section className="py-20 bg-[#FFF8F5] border-b border-[#F47B8F]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#E94B83]" />
                  <span>Shared Experiences</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                  Good company can look like anything.
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* CARD 1 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    ☕
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Coffee &amp; Conversation</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Grab a coffee and have a real conversation.
                  </p>
                </div>

                {/* CARD 2 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    🎟️
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Events</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Attend concerts, exhibitions, festivals or public events together.
                  </p>
                </div>

                {/* CARD 3 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    🚶
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Explore</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Walk around the city, explore new places or discover local spots.
                  </p>
                </div>

                {/* CARD 4 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    🍜
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Food &amp; Conversations</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Share a meal and spend some quality time together.
                  </p>
                </div>

                {/* CARD 5 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    🎮
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Activities</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Play games, visit interesting places or enjoy a shared activity.
                  </p>
                </div>

                {/* CARD 6 */}
                <div className="bg-white p-7 rounded-3xl border border-[#F47B8F]/20 shadow-sm hover:shadow-xl hover:border-[#E94B83]/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-2xl flex items-center justify-center mb-4 border border-[#F47B8F]/30">
                    💬
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292126] mb-2">Just Company</h3>
                  <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                    Sometimes you simply want someone to talk to.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 5. COMPANION DISCOVERY ==================== */}
          <CompanionDiscoverySection
            initialCompanions={
              currentUser
                ? featuredCompanions
                : featuredCompanions.map((comp) => ({
                    ...comp,
                    displayName: '••••••',
                    bio: 'Create an account or log in to view full companion profile details and bio.',
                    city: { name: 'City hidden' },
                    username: 'locked',
                  }))
            }
            isLoggedIn={!!currentUser}
          />

          {/* ==================== 6. REGISTRATION FEE SECTION ==================== */}
          <section id="pricing" className="scroll-mt-24 py-20 bg-[#FFF8F5] border-b border-[#F47B8F]/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full mb-3 shadow-sm">
                  <span>Transparent Pricing</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                  Platform Pricing
                </h2>
              </div>

              {/* Pricing Card */}
              <div className="bg-white border border-[#F47B8F]/30 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
                <div className="space-y-6 max-w-md mx-auto">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#756A70] block">Platform Fee</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl sm:text-6xl font-black text-[#6D315D]">₹399</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#E94B83] block">₹399 ONE-TIME PLATFORM REGISTRATION</span>

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

                  <p className="text-xs text-[#756A70] leading-relaxed border-t border-slate-100 pt-4 font-medium">
                    A one-time ₹399 registration fee is charged to create and activate your Paireva account. This covers account onboarding, profile verification, safety checks, and access to the Paireva platform. Companion booking charges, if applicable, are separate.
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/register"
                      className="w-full bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-sm py-4 px-8 rounded-2xl shadow-lg transition-all inline-block hover:scale-[1.02] cursor-pointer"
                    >
                      Register for ₹399 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 7. DEDICATED SAFETY BANNER ==================== */}
          <section className="py-20 bg-[#6D315D] text-white border-b border-[#F47B8F]/20 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-rose-200 text-xs font-extrabold px-3.5 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Safety Guidelines</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Meet smart. Meet safe.
              </h2>

              <div className="bg-white/10 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-md text-left max-w-xl mx-auto space-y-3.5 text-xs sm:text-sm font-medium text-rose-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Keep first meetings in public places.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Keep communication respectful.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Never share sensitive financial information.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Report suspicious or inappropriate behaviour.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>If something feels wrong, leave.</span>
                </div>
              </div>

              <div>
                <Link
                  href="/safety"
                  className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs sm:text-sm px-8 py-4 rounded-2xl shadow-xl transition-all inline-block hover:scale-105 cursor-pointer"
                >
                  Read Safety Guidelines →
                </Link>
              </div>
            </div>
          </section>

          {/* ==================== 8. FAQ SECTION ==================== */}
          <FAQSection />

          {/* STICKY MOBILE CTA BAR */}
          <StickyMobileCTA />
        </>
      )}

      <Footer />
    </div>
  );
}

