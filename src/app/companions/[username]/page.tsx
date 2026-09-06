import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingForm from '@/components/BookingForm';
import ReportButton from '@/components/ReportButton';
import StartChatButton from '@/components/StartChatButton';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Star, MapPin, Globe, Heart, Sparkles, Calendar, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';

interface CompanionProfilePageProps {
  params: {
    username: string;
  };
}

export default async function CompanionProfilePage({ params }: CompanionProfilePageProps) {
  const currentUser = await getSessionUser();

  // REQUIREMENT: Users MUST be logged in to view companion profile
  if (!currentUser) {
    redirect(`/login?redirectTo=/companions/${params.username}`);
  }

  const companion = await prisma.companionProfile.findUnique({
    where: { username: params.username },
    include: {
      city: true,
      activities: {
        include: { activity: true },
      },
      availabilitySlots: {
        where: { isBooked: false },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      },
    },
  });

  if (!companion || companion.verificationStatus !== 'VERIFIED') {
    return notFound();
  }

  // Fetch reviews for this companion
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: companion.userId,
      isCustomerReviewingCompanion: true,
    },
    include: {
      reviewer: {
        select: {
          customerProfile: { select: { name: true, displayAvatar: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const displayPhoto = companion.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            {/* PROFILE HEADER CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Photo */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shrink-0 shadow-md">
                  <Image
                    src={displayPhoto}
                    alt={companion.displayName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {companion.displayName}, {companion.age}
                      </h1>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <MapPin className="w-4 h-4 text-brand-600" />
                        <span>{companion.city.name}, India</span>
                      </div>
                    </div>
                    <ReportButton reportedUserId={companion.userId} />
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{companion.averageRating > 0 ? companion.averageRating.toFixed(1) : 'New'}</span>
                      <span className="text-slate-400 font-normal">({companion.totalReviews} reviews)</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ID Verified
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div className="pt-2">
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Hourly Rate</span>
                    <span className="text-2xl font-black text-slate-900">₹{companion.hourlyPrice}</span>
                    <span className="text-xs text-slate-500"> / hour</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GALLERY SECTION */}
            {companion.gallery.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600" /> Photo Gallery
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {companion.gallery.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                      <Image src={url} alt={`Gallery ${i}`} fill className="object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABOUT & BIO */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">About {companion.displayName}</h3>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{companion.bio}</p>
              </div>

              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Globe className="w-4 h-4 text-brand-600" /> Languages Spoken
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {companion.languages.map((lang, i) => (
                      <span key={i} className="text-xs font-medium bg-slate-100 text-slate-800 px-3 py-1 rounded-full">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Heart className="w-4 h-4 text-rosebrand-500" /> Personal Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {companion.interests.map((interest, i) => (
                      <span key={i} className="text-xs font-medium bg-rosebrand-50 text-rosebrand-700 px-3 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Available Social Activities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {companion.activities.map((act) => (
                    <div key={act.activity.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{act.activity.name}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{act.activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Customer Reviews ({reviews.length})
                </h3>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {rev.reviewer.customerProfile?.name || 'Verified Client'}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700">{rev.comment}</p>
                      <span className="text-[10px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No reviews yet. Be the first to book and review {companion.displayName}.</p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE BOOKING & MESSAGING WIDGET */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Social Booking</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-900">₹{companion.hourlyPrice}</span>
                  <span className="text-xs text-slate-500"> / hour</span>
                </div>
              </div>

              {/* BOOKING FORM CLIENT COMPONENT */}
              <BookingForm companion={companion} currentUser={currentUser} />

              {/* DIRECT CHAT BUTTON */}
              <div className="border-t border-slate-100 pt-4">
                <StartChatButton companionUserId={companion.userId} companionName={companion.displayName} />
              </div>

              <div className="space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Public Locations Only</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Strict non-sexual social activities policy. Personal contact info hidden for safety.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
