import React from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompanionCard from '@/components/CompanionCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Search, Filter, ShieldCheck, MapPin, Sparkles, Star, ChevronLeft, ChevronRight, X, UserCheck } from 'lucide-react';

interface CompanionsPageProps {
  searchParams: {
    city?: string;
    activity?: string;
    date?: string;
    gender?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    language?: string;
    search?: string;
    page?: string;
  };
}

export default async function CompanionsPage({ searchParams }: CompanionsPageProps) {
  const currentUser = await getSessionUser();

  // REQUIREMENT: Users MUST be logged in to discover companions
  if (!currentUser) {
    redirect('/login?redirectTo=/companions');
  }

  // Companions cannot book other companions
  if (currentUser.role === 'COMPANION') {
    redirect('/companion-dashboard');
  }

  const city = searchParams.city || '';
  const activity = searchParams.activity || '';
  const date = searchParams.date || '';
  const explicitGender = searchParams.gender || '';
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined;
  const minRating = searchParams.minRating ? parseFloat(searchParams.minRating) : undefined;
  const language = searchParams.language || '';
  const search = searchParams.search || '';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 9;
  const skip = (page - 1) * limit;

  const [citiesList, activitiesList] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
    prisma.activity.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const whereClause: any = {
    verificationStatus: 'VERIFIED',
  };

  // AUTOMATIC OPPOSITE GENDER MATCHING RULE
  if (explicitGender) {
    whereClause.gender = { equals: explicitGender, mode: 'insensitive' };
  } else if (currentUser.customerProfile?.gender) {
    const custGender = currentUser.customerProfile.gender.toLowerCase();
    if (custGender === 'male') {
      whereClause.gender = { equals: 'Female', mode: 'insensitive' };
    } else if (custGender === 'female') {
      whereClause.gender = { equals: 'Male', mode: 'insensitive' };
    }
  }

  if (city) {
    whereClause.city = {
      OR: [{ slug: city }, { id: city }, { name: { equals: city, mode: 'insensitive' } }],
    };
  }

  if (activity) {
    whereClause.activities = {
      some: {
        activity: {
          OR: [{ slug: activity }, { id: activity }, { name: { equals: activity, mode: 'insensitive' } }],
        },
      },
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.hourlyPrice = {};
    if (minPrice !== undefined) whereClause.hourlyPrice.gte = minPrice;
    if (maxPrice !== undefined) whereClause.hourlyPrice.lte = maxPrice;
  }

  if (minRating !== undefined) {
    whereClause.averageRating = { gte: minRating };
  }

  if (language) {
    whereClause.languages = { has: language };
  }

  if (search) {
    whereClause.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
      { interests: { has: search } },
    ];
  }

  if (date) {
    whereClause.availabilitySlots = {
      some: {
        date,
        isBooked: false,
      },
    };
  }

  const [companions, total] = await Promise.all([
    prisma.companionProfile.findMany({
      where: whereClause,
      skip,
      take: limit,
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
    prisma.companionProfile.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const matchedGenderLabel =
    currentUser.customerProfile?.gender?.toLowerCase() === 'male'
      ? 'Female Companions (Rent Girlfriend)'
      : currentUser.customerProfile?.gender?.toLowerCase() === 'female'
      ? 'Male Companions (Rent Boyfriend)'
      : 'Verified Companions';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      {/* PAGE HEADER */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% ID Verified & Matched Profiles
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {matchedGenderLabel}
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Discover verified companions for dining out, movie dates, sightseeing, and social events.
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-500">
              Showing <span className="text-slate-900 font-bold">{companions.length}</span> of{' '}
              <span className="text-slate-900 font-bold">{total}</span> candidates
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR FILTERS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Filter className="w-4 h-4 text-brand-600" />
                  Filter Candidates
                </div>
                {(city || activity || date || minPrice || maxPrice || search || explicitGender) && (
                  <Link href="/companions" className="text-xs text-rosebrand-600 hover:underline flex items-center gap-1 font-medium">
                    <X className="w-3 h-3" />
                    Reset
                  </Link>
                )}
              </div>

              <form action="/companions" method="GET" className="space-y-4">
                {/* Gender filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender Candidate</label>
                  <select
                    name="gender"
                    defaultValue={explicitGender || (currentUser.customerProfile?.gender?.toLowerCase() === 'male' ? 'Female' : currentUser.customerProfile?.gender?.toLowerCase() === 'female' ? 'Male' : '')}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Candidates</option>
                    <option value="Female">Female Candidates (Rent Girlfriend)</option>
                    <option value="Male">Male Candidates (Rent Boyfriend)</option>
                  </select>
                </div>

                {/* Search text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Search Keywords</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="search"
                      defaultValue={search}
                      placeholder="Name, interest, bio..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    name="city"
                    defaultValue={city}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Cities</option>
                    {citiesList.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Activity</label>
                  <select
                    name="activity"
                    defaultValue={activity}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Activities</option>
                    {activitiesList.map((a) => (
                      <option key={a.id} value={a.slug}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Filter */}
                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-colors mt-2"
                >
                  Apply Filters
                </button>
              </form>
            </div>
          </div>

          {/* COMPANION CARDS GRID & PAGINATION */}
          <div className="lg:col-span-3 space-y-8">
            {companions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companions.map((comp) => (
                    <CompanionCard key={comp.id} companion={comp} />
                  ))}
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    {page > 1 && (
                      <Link
                        href={`/companions?page=${page - 1}&city=${city}&activity=${activity}&search=${search}&date=${date}`}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Link>
                    )}

                    <span className="text-sm font-semibold text-slate-700 px-4">
                      Page {page} of {totalPages}
                    </span>

                    {page < totalPages && (
                      <Link
                        href={`/companions?page=${page + 1}&city=${city}&activity=${activity}&search=${search}&date=${date}`}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Candidates Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  We couldn't find any verified companion matching your exact search filters. Try broadening your city or activity selections.
                </p>
                <Link
                  href="/companions"
                  className="inline-block bg-brand-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
                >
                  Clear Filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
