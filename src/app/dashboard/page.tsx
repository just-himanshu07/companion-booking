import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionCard from '@/components/CompanionCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ShieldCheck,
  Calendar,
  Heart,
  Bell,
  User,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Search,
  Clock,
  CheckCircle2,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard — Paireva',
  description: 'Manage your Paireva customer account, companion bookings, favorites, and messages.',
};

interface DashboardPageProps {
  searchParams?: {
    locked?: string;
  };
}

const DUMMY_LOCKED_CARDS = [
  {
    id: 'lock-card-1',
    username: 'candidate_1',
    displayName: 'Verified Candidate',
    age: 24,
    gender: 'Female',
    hourlyPrice: 1500,
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'VERIFIED',
    averageRating: 4.9,
    totalReviews: 12,
    city: { name: 'Protected Location' },
    activities: [{ activity: { name: 'Dining & Events' } }],
  },
  {
    id: 'lock-card-2',
    username: 'candidate_2',
    displayName: 'Verified Candidate',
    age: 23,
    gender: 'Female',
    hourlyPrice: 1800,
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'VERIFIED',
    averageRating: 4.8,
    totalReviews: 8,
    city: { name: 'Protected Location' },
    activities: [{ activity: { name: 'Coffee & Outings' } }],
  },
  {
    id: 'lock-card-3',
    username: 'candidate_3',
    displayName: 'Verified Candidate',
    age: 25,
    gender: 'Female',
    hourlyPrice: 2000,
    profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'VERIFIED',
    averageRating: 5.0,
    totalReviews: 15,
    city: { name: 'Protected Location' },
    activities: [{ activity: { name: 'Concerts & Shows' } }],
  },
];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role === 'COMPANION') {
    redirect('/companion-dashboard');
  }

  if (currentUser.role === 'ADMIN') {
    redirect('/admin');
  }

  const userName = currentUser.customerProfile?.name || currentUser.email.split('@')[0];
  const isAccountActive = currentUser.accountStatus === 'ACTIVE';
  const isUnderReview = currentUser.accountStatus === 'UNDER_REVIEW';
  const isRejected = currentUser.accountStatus === 'REJECTED';
  const isPendingIdentity = currentUser.accountStatus === 'PENDING_IDENTITY_VERIFICATION';

  const [bookings, favorites, notifications] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: currentUser.id },
      select: {
        id: true,
        bookingNumber: true,
        date: true,
        startTime: true,
        durationHours: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        companion: {
          select: {
            displayName: true,
            profilePhoto: true,
            city: { select: { name: true } },
          },
        },
        activity: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.favorite.findMany({
      where: { customerId: currentUser.id },
      select: {
        id: true,
        createdAt: true,
        companion: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
            hourlyPrice: true,
            averageRating: true,
            city: { select: { name: true } },
          },
        },
      },
      take: 3,
    }),
    prisma.notification.findMany({
      where: {
        userId: currentUser.id,
        ...(currentUser.isRegistrationFeePaid
          ? {
              NOT: {
                title: 'Welcome to Companion Marketplace!',
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-1 space-y-8">
        {/* Welcome Header Banner */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#E94B83]" />
                <span>Customer Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
                Welcome to Paireva, {userName}!
              </h1>
              <p className="text-xs sm:text-sm text-[#756A70] font-medium max-w-2xl leading-relaxed">
                Discover verified companions for coffee dates, dining, movies, concerts, and public social experiences.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isAccountActive ? (
                <Link
                  href="/companions"
                  className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md shadow-[#E94B83]/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Find a Companion →
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-slate-200 text-slate-500 font-extrabold text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2 cursor-not-allowed opacity-80"
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  Marketplace Locked
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Unpaid Registration Fee Alert Banner */}
        {!currentUser.isRegistrationFeePaid && (
          <div className="bg-gradient-to-r from-amber-600 via-rosebrand-600 to-brand-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-extrabold px-3.5 py-1 rounded-full backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-amber-200" />
                  <span>Action Required — Registration Fee Pending</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Complete your ₹399 Registration Fee
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
                  Your account is created, but platform features (checking availability, companion bookings, and messaging) require a one-time ₹399 registration payment.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/register?step=2"
                  className="bg-white hover:bg-slate-100 text-brand-700 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Pay ₹399 &amp; Activate Account →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Identity Verification Status Alert Banners */}
        {currentUser.isRegistrationFeePaid && isUnderReview && (
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-extrabold px-3.5 py-1 rounded-full">
              <Clock className="w-4 h-4 text-amber-200" />
              <span>Identity Verification — Under Manual Review</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Your Account Is Under Verification</h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
              Our safety compliance team is manually reviewing your submitted government ID and live selfie. You will receive full platform access as soon as your account is approved.
            </p>
          </div>
        )}

        {currentUser.isRegistrationFeePaid && isRejected && (
          <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-extrabold px-3.5 py-1 rounded-full">
              <ShieldAlert className="w-4 h-4 text-rose-200" />
              <span>Identity Verification Rejected</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Verification Resubmission Required</h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
              Reason: {currentUser.identityVerification?.rejectionReason || 'Uploaded ID document or selfie was unclear.'}
            </p>
            <div className="pt-2">
              <Link
                href="/identity-verification"
                className="inline-flex items-center gap-2 bg-white text-rose-700 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Resubmit Identity Verification →
              </Link>
            </div>
          </div>
        )}

        {currentUser.isRegistrationFeePaid && isPendingIdentity && (
          <div className="bg-gradient-to-r from-purple-700 via-brand-600 to-purple-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-extrabold px-3.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>Step Required — Identity Verification</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Complete Identity Verification</h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
              To keep Paireva safe and limited to genuine users, complete identity verification before using the platform.
            </p>
            <div className="pt-2">
              <Link
                href="/identity-verification"
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Verify Identity Now →
              </Link>
            </div>
          </div>
        )}

        {/* MARKETPLACE SECTION (BLURRED & LOCKED FOR UNAPPROVED ACCOUNTS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E94B83]" />
              Featured Verified Companions
            </h2>
            {isAccountActive && (
              <Link href="/companions" className="text-xs font-bold text-[#E94B83] hover:underline">
                Explore All →
              </Link>
            )}
          </div>

          <div className="relative rounded-3xl overflow-hidden p-2">
            {/* Companion Cards Container (Blurred for unapproved accounts) */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${
                !isAccountActive ? 'filter blur-md select-none pointer-events-none opacity-60' : ''
              }`}
            >
              {DUMMY_LOCKED_CARDS.map((comp) => (
                <CompanionCard key={comp.id} companion={comp} isLocked={!isAccountActive} />
              ))}
            </div>

            {/* Lock Overlay Card over Marketplace */}
            {!isAccountActive && (
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-sm rounded-3xl z-20">
                <div className="max-w-md w-full bg-white/95 backdrop-blur-xl border border-[#F47B8F]/30 p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#E94B83] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#FFF0F3] text-[#6D315D] text-[10px] font-extrabold px-3 py-1 rounded-full border border-[#F47B8F]/30 uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#E94B83]" />
                      Marketplace Locked
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#292126]">
                      {isUnderReview
                        ? 'Your account is under verification'
                        : isRejected
                        ? 'Identity Verification Rejected'
                        : 'Identity Verification Required'}
                    </h3>
                    <p className="text-xs text-[#756A70] font-medium leading-relaxed max-w-sm mx-auto">
                      {isUnderReview
                        ? 'Complete verification approval to access companions, bookings, and marketplace features. Our admin team is reviewing your identity documents and selfie.'
                        : isRejected
                        ? 'Your identity verification was rejected. Please resubmit clear government ID documents and live selfie.'
                        : 'Complete identity verification approval to unlock companion listings, instant bookings, and messaging.'}
                    </p>
                  </div>

                  {(isRejected || isPendingIdentity) && (
                    <div className="pt-1">
                      <Link
                        href="/identity-verification"
                        className="inline-flex items-center justify-center gap-2 w-full bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-[#E94B83]/20 transition-all text-xs cursor-pointer"
                      >
                        <span>{isRejected ? 'Resubmit Verification' : 'Verify Identity Now'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/profile?tab=bookings"
            className="bg-white p-5 rounded-2xl border border-[#F47B8F]/30 shadow-sm hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-[#E94B83]" />
            </div>
            <div className="text-2xl font-black text-[#292126]">{bookings.length}</div>
            <div className="text-xs font-bold text-[#6D315D] flex items-center justify-between">
              My Bookings <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/messages"
            className="bg-white p-5 rounded-2xl border border-[#F47B8F]/30 shadow-sm hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-[#E94B83]" />
            </div>
            <div className="text-2xl font-black text-[#292126]">Messages</div>
            <div className="text-xs font-bold text-[#6D315D] flex items-center justify-between">
              In-App Chat <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/profile?tab=favorites"
            className="bg-white p-5 rounded-2xl border border-[#F47B8F]/30 shadow-sm hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 text-[#E94B83]" />
            </div>
            <div className="text-2xl font-black text-[#292126]">{favorites.length}</div>
            <div className="text-xs font-bold text-[#6D315D] flex items-center justify-between">
              Saved Favorites <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/profile?tab=edit"
            className="bg-white p-5 rounded-2xl border border-[#F47B8F]/30 shadow-sm hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center font-bold">
              <User className="w-5 h-5 text-[#E94B83]" />
            </div>
            <div className="text-2xl font-black text-[#292126]">
              {currentUser.accountStatus === 'ACTIVE' ? 'Active' : 'Unapproved'}
            </div>
            <div className="text-xs font-bold text-[#6D315D] flex items-center justify-between">
              Account Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Recent Bookings & Notifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#E94B83]" />
                Recent Companion Bookings
              </h2>
              <Link href="/profile?tab=bookings" className="text-xs font-bold text-[#E94B83] hover:underline">
                View All →
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#F47B8F]/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6 text-[#E94B83]" />
                </div>
                <h3 className="font-extrabold text-[#292126] text-sm">No Companion Bookings Yet</h3>
                <p className="text-xs text-[#756A70]">
                  Explore available companions in your city for coffee dates, dining, or movies.
                </p>
                <div className="pt-2">
                  {isAccountActive ? (
                    <Link
                      href="/companions"
                      className="inline-flex items-center gap-2 bg-[#E94B83] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm"
                    >
                      Browse Companions
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 bg-slate-200 text-slate-500 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-not-allowed opacity-80"
                    >
                      Browse Companions (Locked)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white p-5 rounded-2xl border border-[#F47B8F]/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#292126]">
                          {booking.companion.displayName}
                        </span>
                        <span className="text-xs text-[#756A70]">({booking.companion.city.name})</span>
                      </div>
                      <div className="text-xs text-[#756A70] font-medium flex items-center gap-3">
                        <span>📅 {booking.date} at {booking.startTime}</span>
                        <span>🏷️ {booking.activity.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-[#6D315D] bg-[#FFF0F3] px-3 py-1 rounded-full border border-[#F47B8F]/30">
                        ₹{booking.totalAmount}
                      </span>
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Notifications & Safety */}
          <div className="space-y-6">
            {/* System Notifications */}
            <div className="bg-white p-6 rounded-3xl border border-[#F47B8F]/30 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-[#6D315D] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#E94B83]" />
                Recent Notifications
              </h3>

              {notifications.length === 0 ? (
                <p className="text-xs text-[#756A70]">No new notifications.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="text-xs space-y-0.5 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                      <div className="font-bold text-[#292126]">{n.title}</div>
                      <div className="text-[#756A70] leading-normal">{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safety Banner */}
            <div className="bg-[#FFF0F3] p-5 rounded-3xl border border-[#F47B8F]/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-[#6D315D]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Paireva Safety Guarantee
              </div>
              <p className="text-[#756A70] leading-relaxed font-medium">
                All companion bookings take place exclusively in public venues (cafes, restaurants, theaters). Sexual services and private residence meetings are strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
