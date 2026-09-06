import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionCard from '@/components/CompanionCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Search, MapPin, Sparkles, Utensils, Film, Compass, Music, Palette, Coffee, ShoppingBag, ArrowRight, Lock, Calendar, MessageSquare, Heart, ChevronRight, HelpCircle } from 'lucide-react';

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
    currentUser
      ? prisma.companionProfile.findMany({
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
        })
      : Promise.resolve([]),
    prisma.city.findMany({
      where: { isPopular: true },
      take: 6,
    }),
    prisma.activity.findMany({
      take: 8,
    }),
    currentUser
      ? prisma.booking.findMany({
          where: { customerId: currentUser.id },
          take: 2,
          orderBy: { createdAt: 'desc' },
          include: {
            companion: { select: { displayName: true } },
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
      : 'Featured Verified Candidates';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      {/* ========================================================================= */}
      {/* 1. LOGGED-IN VIEW: CLEAN, FUNCTIONAL DASHBOARD (OPPOSITE GENDER MATCHING) */}
      {/* ========================================================================= */}
      {currentUser ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
          {/* WELCOME HEADER & QUICK SHORTCUTS */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Opposite-Gender Match Active ({currentUser.customerProfile?.gender || 'Member'})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Rent a Boyfriend / Girlfriend — Welcome, {currentUser.customerProfile?.name || currentUser.companionProfile?.displayName || 'Member'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Discover verified companion candidates for social activities in your city.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/profile?tab=bookings"
                className="bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-brand-600" /> My Bookings
              </Link>
              <Link
                href="/messages"
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>
            </div>
          </div>

          {/* QUICK HOW-IT-WORKS INFO FOR LOGGED-IN USERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Opposite Gender Match</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Male members see female companions; female members see male companions.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rosebrand-50 text-rosebrand-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Public Social Activities</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Book for fine dining, movies, concerts, sightseeing, and public events.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">3</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Verified & Safe</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">100% photo ID verified companions. Phone/email contact masking in chat.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">4</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Strictly Non-Sexual</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Social companionship only. Zero tolerance for harassment or illegal activity.</p>
              </div>
            </div>
          </div>

          {/* ACTIVE BOOKINGS PREVIEW (IF ANY) */}
          {userRecentBookings.length > 0 && (
            <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-300">Upcoming Active Booking</span>
                <Link href="/profile?tab=bookings" className="text-xs text-brand-300 hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white">
                    {userRecentBookings[0].activity.name} with {userRecentBookings[0].companion.displayName}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Date: {userRecentBookings[0].date} at {userRecentBookings[0].startTime} ({userRecentBookings[0].durationHours} hrs)
                  </p>
                </div>
                <Link
                  href="/messages"
                  className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs px-4 py-2 rounded-xl shrink-0 transition-colors"
                >
                  Open Chat
                </Link>
              </div>
            </div>
          )}

          {/* COMPANION SEARCH & DISCOVERY WORKSPACE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Find Your Social Companion</h2>
                <p className="text-xs text-slate-500 mt-0.5">Filter by city, activity, or date</p>
              </div>
              <Link href="/companions" className="text-xs font-bold text-brand-600 hover:underline">
                Open Directory & Filters →
              </Link>
            </div>

            {/* Quick Filter Form */}
            <form action="/companions" method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  name="city"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-800 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 appearance-none"
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
                <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  name="activity"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-800 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 appearance-none"
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
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Search Candidates
              </button>
            </form>
          </div>

          {/* FEATURED VERIFIED COMPANIONS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{genderPreferenceHeading}</h2>
              <Link href="/companions" className="text-xs font-bold text-brand-600 hover:underline">
                View All Candidates ({featuredCompanions.length}+)
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCompanions.map((comp) => (
                <CompanionCard key={comp.id} companion={comp} />
              ))}
            </div>
          </div>

          {/* DISCREET HELP & SAFETY FOOTER LINK */}
          <div className="p-4 bg-slate-100/60 rounded-2xl text-center text-xs text-slate-500 flex items-center justify-center gap-4">
            <Link href="/safety" className="hover:text-slate-800 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Safety Center
            </Link>
            <span>•</span>
            <Link href="/prohibited-services" className="hover:text-slate-800">
              Prohibited Services Policy
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-800">
              Contact Support
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. LOGGED-OUT VIEW: RENT BOYFRIEND / RENT GIRLFRIEND LANDING PAGE         */
        /* ========================================================================= */
        <>
          {/* HERO SECTION */}
          <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950 text-white py-20 lg:py-28">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#36a9f8_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Rent a Boyfriend / Girlfriend — 100% Verified Non-Sexual Social Platform</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Rent a Girlfriend. Rent a Boyfriend. Rent Some Company.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Looking for someone to talk to, grab coffee with, attend an event with, or simply spend time with? Discover companions available by the hour.
                </p>

                {/* CTAs FOR LOGGED-OUT VISITORS */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link
                    href="/companions"
                    className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] text-base inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Find Your Companion →
                  </Link>
                  <Link
                    href="/register-companion"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] text-base inline-flex items-center justify-center cursor-pointer backdrop-blur-sm"
                  >
                    Become a Companion
                  </Link>
                </div>

                {/* CONVERSION & TRUST LINE */}
                <p className="text-xs sm:text-sm text-slate-400 font-medium pt-2">
                  Browse verified profiles • Compare hourly rates • Book your time
                </p>
              </div>
            </div>
          </section>

          {/* LOGIN REQUIRED BARNER FOR PREVIEW */}
          <section className="py-12 bg-white border-b border-slate-100 text-center">
            <div className="max-w-xl mx-auto px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Protected Companion Marketplace</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you log in as a male customer, female candidates are automatically displayed. When you log in as a female customer, male candidates are displayed!
              </p>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="py-16 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-extrabold text-slate-900">How Renting a Companion Works</h2>
                <p className="text-slate-600 text-sm mt-2">Book a verified boyfriend/girlfriend companion in 3 simple steps</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-black text-xl mx-auto mb-6">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Register Gender & Account</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Create your 18+ customer account and pay the one-time ₹149 registration fee. Male users see female candidates; female users see male candidates!
                  </p>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="w-14 h-14 rounded-2xl bg-rosebrand-100 text-rosebrand-600 flex items-center justify-center font-black text-xl mx-auto mb-6">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Select Date & Book Slot</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Browse candidate profiles by city and activity. Select date, time, and duration with 100% double-booking protection.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl mx-auto mb-6">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Meet in Public & Enjoy</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Meet at your chosen public restaurant, theater, or event venue. Share a great date experience and review your companion.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ SECTION */}
          <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
              <p className="text-slate-600 text-sm mt-1">Everything you need to know about renting a companion</p>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900">Is this a dating or escort website?</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  No. Companion is strictly a social marketplace for hiring verified companions for public social activities (dinners, movies, concerts, business networking, sightseeing). Sexual services are strictly prohibited.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900">How does gender matching work?</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  When a male customer logs in, female candidates are automatically displayed (Rent Girlfriend). When a female customer logs in, male candidates are automatically displayed (Rent Boyfriend)!
                </p>
              </div>
            </div>
          </section>

          {/* BECOME A COMPANION CTA */}
          <section className="py-16 bg-gradient-to-r from-brand-600 to-rosebrand-600 text-white text-center">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to Earn as a Social Companion?</h2>
              <p className="text-brand-100 text-sm max-w-xl mx-auto">
                Set your hourly rate, choose your preferred activities, and meet fascinating clients for social events in your city.
              </p>
              <div className="pt-2">
                <Link
                  href="/register-companion"
                  className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 py-4 rounded-xl shadow-xl transition-all inline-block text-sm"
                >
                  Become a Companion Today
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
