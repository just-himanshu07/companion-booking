import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionCard from '@/components/CompanionCard';
import ReviewModalButton from '@/components/ReviewModalButton';
import CustomerProfileEditForm from '@/components/CustomerProfileEditForm';
import CustomerAvailabilityRequests from '@/components/CustomerAvailabilityRequests';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Calendar, Heart, Bell, User, MapPin, MessageSquare, Star, Settings, Lock, Sparkles } from 'lucide-react';

interface ProfilePageProps {
  searchParams: {
    tab?: string;
  };
}

export default async function CustomerProfilePage({ searchParams }: ProfilePageProps) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login');
  }

  const activeTab = searchParams.tab || 'bookings';

  const [bookings, favorites, notifications, availabilityRequests] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: currentUser.id },
      include: {
        companion: {
          include: {
            city: true,
            user: { select: { id: true, email: true } },
          },
        },
        activity: true,
        review: true,
        conversation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.favorite.findMany({
      where: { customerId: currentUser.id },
      include: {
        companion: {
          include: {
            city: true,
            activities: { include: { activity: true } },
          },
        },
      },
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
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.availabilityRequest.findMany({
      where: { customerId: currentUser.id },
      include: {
        companion: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profilePhoto: true,
            hourlyPrice: true,
            city: { select: { name: true } },
            activities: { include: { activity: true } },
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* USER PROFILE HEADER CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-2xl shadow-inner overflow-hidden">
                {currentUser.customerProfile?.displayAvatar ? (
                  <img src={currentUser.customerProfile.displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (currentUser.customerProfile?.name || currentUser.email)[0].toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {currentUser.customerProfile?.name || 'Customer Account'}
                </h1>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {currentUser.isRegistrationFeePaid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> ₹399 Registration Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Fee Pending (₹399)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/companions"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
            >
              Book New Companion
            </Link>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
          <Link
            href="/profile?tab=requests"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'requests' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
            Availability Requests ({availabilityRequests.length})
          </Link>

          <Link
            href="/profile?tab=bookings"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'bookings' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            My Bookings ({bookings.length})
          </Link>

          <Link
            href="/profile?tab=edit"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'edit' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 text-brand-500" />
            Edit Profile
          </Link>

          <Link
            href="/profile?tab=favorites"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'favorites' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-4 h-4 text-rosebrand-500" />
            Saved Companions ({favorites.length})
          </Link>

          <Link
            href="/profile?tab=notifications"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'notifications' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            Notifications ({notifications.filter((n) => !n.isRead).length})
          </Link>
        </div>

        {/* TAB 0: REQUESTS */}
        {activeTab === 'requests' && (
          <CustomerAvailabilityRequests
            initialRequests={availabilityRequests}
            currentUser={currentUser}
          />
        )}

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">#{booking.bookingNumber}</span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {booking.activity.name} with {booking.companion.displayName}
                      </h3>
                    </div>
                    <div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                          booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : booking.status === 'PENDING' || booking.status === 'PAYMENT_PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rosebrand-50 text-rosebrand-700 border border-rosebrand-200'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-semibold">Date & Time</span>
                      <span className="font-bold text-slate-900">{booking.date} at {booking.startTime}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Duration</span>
                      <span className="font-bold text-slate-900">{booking.durationHours} hrs</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">City</span>
                      <span className="font-bold text-slate-900">{booking.companion.city.name}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Total Paid</span>
                      <span className="font-bold text-brand-600 text-sm">₹{booking.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3">
                    {['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? (
                      <Link
                        href={booking.conversation ? `/messages?conversationId=${booking.conversation.id}` : '/messages'}
                        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat with Companion
                      </Link>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 cursor-not-allowed"
                        title="Messaging is available after your booking is confirmed."
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        Messaging Locked
                      </span>
                    )}

                    {booking.status === 'COMPLETED' && !booking.review && (
                      <ReviewModalButton bookingId={booking.id} companionName={booking.companion.displayName} />
                    )}

                    {booking.review && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        ✓ Reviewed ({booking.review.rating} ★)
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No Bookings Yet</h3>
                <p className="text-xs text-slate-500">Discover verified companions for dining out, movies, and events.</p>
                <Link
                  href="/companions"
                  className="inline-block bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Explore Companions
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-600" /> Edit Customer Profile & Details
            </h3>
            <CustomerProfileEditForm initialProfile={currentUser.customerProfile} />
          </div>
        )}

        {/* TAB 3: FAVORITES */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((fav) => (
                  <CompanionCard key={fav.id} companion={fav.companion} isFavoriteInitial={true} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Heart className="w-10 h-10 text-rosebrand-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No Saved Favorites</h3>
                <p className="text-xs text-slate-500">Heart companion profiles while browsing to save them here.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Notifications History</h3>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
