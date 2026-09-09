import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionAvailabilityRequests from '@/components/CompanionAvailabilityRequests';
import CompanionProfileEditForm from '@/components/CompanionProfileEditForm';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Calendar, ShieldCheck, Activity, FileText, MessageSquare, Lock } from 'lucide-react';

export default async function CompanionDashboardPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'COMPANION' || !currentUser.companionProfile) {
    redirect('/profile');
  }

  const profile = currentUser.companionProfile;

  const [bookings, docs, citiesList, activitiesList, availabilityRequests, conversations] = await Promise.all([
    prisma.booking.findMany({
      where: { companionId: profile.id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            customerProfile: { select: { name: true } },
          },
        },
        activity: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.verificationDocument.findMany({
      where: { companionId: profile.id },
    }),
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
    prisma.activity.findMany({ orderBy: { name: 'asc' } }),
    prisma.availabilityRequest.findMany({
      where: { companionId: profile.id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            customerProfile: { select: { name: true, displayAvatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.conversation.findMany({
      where: { companionUserId: profile.userId },
      select: { id: true, customerId: true },
    }),
  ]);

  const convMap = new Map(conversations.map((c) => [c.customerId, c.id]));

  const totalEarnings = bookings
    .filter((b) => ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status))
    .reduce((sum, b) => sum + b.companionEarnings, 0);

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Dashboard Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">Companion Partner Studio</h1>
              <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage your companion bookings, availability requests, profile settings, and payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Earnings</span>
              <span className="text-xl font-black text-emerald-900">₹{totalEarnings}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Completed Outings</span>
              <span className="text-xl font-black text-slate-900">{completedBookings}</span>
            </div>
          </div>
        </div>

        {/* Availability Requests Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" /> Availability Inquiries &amp; Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Respond to customer date inquiries to unlock direct bookings.
            </p>
          </div>

          <CompanionAvailabilityRequests initialRequests={availabilityRequests} companionId={profile.id} />
        </div>

        {/* Companion Profile Settings */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" /> Public Profile &amp; Gallery Photos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your bio, hourly rate, activities, public city, and profile photos.
              </p>
            </div>
          </div>

          <CompanionProfileEditForm
            initialProfile={profile}
            citiesList={citiesList}
            activitiesList={activitiesList}
          />
        </div>

        {/* Outing Bookings List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" /> Confirmed Outings &amp; Bookings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View confirmed bookings and communicate with clients.
            </p>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((b) => {
                const convId = convMap.get(b.customerId);

                return (
                  <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-400">#{b.bookingNumber}</span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {b.activity.name} with {b.customer.customerProfile?.name || 'Client'}
                        </h4>
                      </div>
                      <span className="text-xs font-bold uppercase bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block">Date &amp; Time</span>
                        <span className="font-semibold text-slate-900">{b.date} at {b.startTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Duration</span>
                        <span className="font-semibold text-slate-900">{b.durationHours} hrs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Your Net Earnings</span>
                        <span className="font-extrabold text-emerald-600">₹{b.companionEarnings}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 pt-2">
                      {['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status) ? (
                        <Link
                          href={convId ? `/messages?conversationId=${convId}` : '/messages'}
                          className="text-xs font-bold text-brand-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 flex items-center gap-1 shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat Center
                        </Link>
                      ) : (
                        <span
                          className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-not-allowed"
                          title="Messaging is available after booking is confirmed."
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          Messaging Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No companion bookings yet. Keep your availability updated to receive inquiries!
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
