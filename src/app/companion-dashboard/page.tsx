import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DocumentUploadForm from '@/components/DocumentUploadForm';
import CompanionProfileEditForm from '@/components/CompanionProfileEditForm';
import CompanionAvailabilityRequests from '@/components/CompanionAvailabilityRequests';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Clock, Calendar, Star, DollarSign, AlertTriangle, CheckCircle2, MessageSquare, Plus, Settings, Lock } from 'lucide-react';

export default async function CompanionDashboardPage() {
  const currentUser = await getSessionUser();

  if (!currentUser || currentUser.role !== 'COMPANION' || !currentUser.companionProfile) {
    redirect('/login');
  }

  const profile = currentUser.companionProfile;

  const [bookings, docs, citiesList, activitiesList, availabilityRequests] = await Promise.all([
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
        conversation: { select: { id: true } },
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
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            conversation: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalEarnings = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.companionEarnings, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* VERIFICATION STATUS BANNER */}
        <div
          className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            profile.verificationStatus === 'VERIFIED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : profile.verificationStatus === 'PENDING' || profile.verificationStatus === 'UNDER_REVIEW'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rosebrand-50 border-rosebrand-200 text-rosebrand-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-bold shadow-sm shrink-0">
              {profile.verificationStatus === 'VERIFIED' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Verification Status: {profile.verificationStatus}</h3>
                {profile.verificationStatus === 'VERIFIED' && (
                  <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Verified Badge Active
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {profile.verificationStatus === 'VERIFIED'
                  ? 'Your profile is publicly visible to clients in search results.'
                  : 'Please upload government ID verification below. Admin review takes 24 hours.'}
              </p>
            </div>
          </div>

          <Link
            href={`/companions/${profile.username}`}
            className="bg-white text-slate-900 font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 shrink-0"
          >
            View Public Profile
          </Link>
        </div>

        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-[#756A70] font-semibold uppercase tracking-wider block">Total Net Earnings</span>
            <div className="text-3xl font-black text-slate-900">₹{totalEarnings}</div>
            <span className="text-[11px] text-emerald-600 font-medium">After 15% platform commission</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-[#756A70] font-semibold uppercase tracking-wider block">Total Bookings</span>
            <div className="text-3xl font-black text-slate-900">{bookings.length}</div>
            <span className="text-[11px] text-[#756A70] font-medium">Social engagements</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-[#756A70] font-semibold uppercase tracking-wider block">Average Rating</span>
            <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
              {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : 'New'}
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-[11px] text-[#756A70] font-medium">From {profile.totalReviews} reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: EDIT PROFILE FORM & BOOKINGS */}
          <div className="lg:col-span-2 space-y-8">
            {/* EDIT PROFILE & RATES FORM */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-600" /> Update Companion Profile, Bio & Rates
              </h3>
              <CompanionProfileEditForm
                initialProfile={profile}
                citiesList={citiesList}
                activitiesList={activitiesList}
              />
            </div>

            {/* AVAILABILITY REQUESTS SECTION */}
            <CompanionAvailabilityRequests
              initialRequests={availabilityRequests}
              companionId={profile.id}
            />

            {/* CLIENT BOOKINGS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" /> Client Bookings
              </h3>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((b) => (
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
                          <span className="text-slate-400 block">Date & Time</span>
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
                            href={b.conversation ? `/messages?conversationId=${b.conversation.id}` : '/messages'}
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
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No bookings received yet.</p>
              )}
            </div>
          </div>

          {/* RIGHT 1 COL: IDENTITY VERIFICATION DOCUMENTS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Identity Verification
              </h3>
              <p className="text-xs text-slate-500">
                Upload government photo ID (Aadhaar / Passport / Driving License) for safety review.
              </p>

              <DocumentUploadForm companionId={profile.id} existingDocs={docs} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
