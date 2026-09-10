import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionCard from '@/components/CompanionCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Calendar, Heart, Bell, User, MessageSquare, Sparkles, ArrowRight, Search, Clock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard — Paireva',
  description: 'Manage your Paireva customer account, companion bookings, favorites, and messages.',
};

export default async function DashboardPage() {
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
              <Link
                href="/companions"
                className="bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md shadow-[#E94B83]/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Find a Companion →
              </Link>
            </div>
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
              {currentUser.isRegistrationFeePaid ? 'Active' : 'Pending'}
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
                  <Link
                    href="/companions"
                    className="inline-flex items-center gap-2 bg-[#E94B83] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm"
                  >
                    Browse Companions
                  </Link>
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

