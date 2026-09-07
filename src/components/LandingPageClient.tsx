'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Star, MapPin, Heart, ChevronDown, ChevronUp, Sparkles, Calendar, Coffee, Music, MessageSquare, ArrowRight, UserCheck, Lock } from 'lucide-react';

interface CompanionItem {
  id: string;
  username: string;
  displayName: string;
  age: number;
  gender?: string | null;
  hourlyPrice: number;
  profilePhoto?: string | null;
  verificationStatus: string;
  averageRating: number;
  totalReviews: number;
  city: { name: string };
  activities: { activity: { name: string } }[];
  bio?: string;
  interests?: string[];
}

interface LandingPageClientProps {
  initialCompanions: CompanionItem[];
}

export function CompanionDiscoverySection({ initialCompanions }: LandingPageClientProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Girlfriend' | 'Boyfriend' | 'Coffee' | 'Events' | 'Conversation'>('All');

  // Fallback high quality demo candidates for visual preview
  const demoCompanions: CompanionItem[] = [
    {
      id: 'demo-1',
      username: 'aria_sharma',
      displayName: 'Aria S.',
      age: 24,
      gender: 'Female',
      hourlyPrice: 800,
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      verificationStatus: 'VERIFIED',
      averageRating: 4.9,
      totalReviews: 14,
      city: { name: 'Mumbai' },
      activities: [{ activity: { name: 'Fine Dining' } }, { activity: { name: 'Coffee & Conversation' } }, { activity: { name: 'Art Galleries' } }],
      bio: 'Culinary lover and art historian. Great companion for upscale dining, indie movies, and stimulating talks.'
    },
    {
      id: 'demo-2',
      username: 'rohan_verma',
      displayName: 'Rohan V.',
      age: 27,
      gender: 'Male',
      hourlyPrice: 750,
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      verificationStatus: 'VERIFIED',
      averageRating: 4.8,
      totalReviews: 11,
      city: { name: 'Delhi NCR' },
      activities: [{ activity: { name: 'Tech Conference' } }, { activity: { name: 'Sightseeing' } }, { activity: { name: 'Coffee' } }],
      bio: 'Tech enthusiast and heritage walk lover. Great date companion for tech expos, dinners, and casual coffee.'
    },
    {
      id: 'demo-3',
      username: 'ananya_mehta',
      displayName: 'Ananya M.',
      age: 25,
      gender: 'Female',
      hourlyPrice: 850,
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      verificationStatus: 'VERIFIED',
      averageRating: 5.0,
      totalReviews: 18,
      city: { name: 'Bengaluru' },
      activities: [{ activity: { name: 'Concerts & Events' } }, { activity: { name: 'Shopping' } }, { activity: { name: 'Fine Dining' } }],
      bio: 'Fashion designer based in Indiranagar. Excellent partner for live concerts, rooftop dining, and boutique shopping.'
    },
    {
      id: 'demo-4',
      username: 'vikram_singh',
      displayName: 'Vikram S.',
      age: 28,
      gender: 'Male',
      hourlyPrice: 900,
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      verificationStatus: 'VERIFIED',
      averageRating: 4.9,
      totalReviews: 9,
      city: { name: 'Goa' },
      activities: [{ activity: { name: 'Beach Sunset Dinner' } }, { activity: { name: 'Sightseeing' } }, { activity: { name: 'Music Festivals' } }],
      bio: 'Certified travel guide and foodie. Perfect host for beachside dinners, watersports events, and coastal tours.'
    },
    {
      id: 'demo-5',
      username: 'priya_kapoor',
      displayName: 'Priya K.',
      age: 23,
      gender: 'Female',
      hourlyPrice: 650,
      profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      verificationStatus: 'VERIFIED',
      averageRating: 4.9,
      totalReviews: 12,
      city: { name: 'Pune' },
      activities: [{ activity: { name: 'Coffee & Conversation' } }, { activity: { name: 'Art Galleries' } }, { activity: { name: 'Movies' } }],
      bio: 'Literature student who enjoys quiet cafe conversations, book club events, and cinema screenings.'
    },
    {
      id: 'demo-6',
      username: 'kabir_nair',
      displayName: 'Kabir N.',
      age: 26,
      gender: 'Male',
      hourlyPrice: 700,
      profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
      verificationStatus: 'VERIFIED',
      averageRating: 4.8,
      totalReviews: 8,
      city: { name: 'Hyderabad' },
      activities: [{ activity: { name: 'Fine Dining' } }, { activity: { name: 'Business Networking' } }, { activity: { name: 'Coffee' } }],
      bio: 'Architect with a passion for cuisine and heritage. Great companion for dinner dates and formal events.'
    }
  ];

  const companionsToUse = initialCompanions.length >= 4 ? initialCompanions : demoCompanions;

  const filteredCompanions = companionsToUse.filter((c) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Girlfriend') return c.gender?.toLowerCase() === 'female';
    if (activeTab === 'Boyfriend') return c.gender?.toLowerCase() === 'male';
    if (activeTab === 'Coffee') return c.activities.some(a => a.activity.name.toLowerCase().includes('coffee') || a.activity.name.toLowerCase().includes('dining'));
    if (activeTab === 'Events') return c.activities.some(a => a.activity.name.toLowerCase().includes('event') || a.activity.name.toLowerCase().includes('concert'));
    if (activeTab === 'Conversation') return c.activities.some(a => a.activity.name.toLowerCase().includes('conversation') || a.activity.name.toLowerCase().includes('talk'));
    return true;
  });

  return (
    <section id="discover" className="py-20 bg-[#FFF8F5] border-b border-[#F47B8F]/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#E94B83]" />
              <span>Companion Discovery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
              Meet Someone Worth <span className="font-serif text-[#6D315D] italic">Spending Time With</span>.
            </h2>
            <p className="text-[#756A70] text-sm sm:text-base mt-2 max-w-2xl font-medium">
              Explore companions based on your city, interests and the experience you're looking for.
            </p>
          </div>

          <Link
            href="/companions"
            className="inline-flex items-center gap-2 text-xs font-extrabold bg-[#6D315D] hover:bg-[#58264A] text-white px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer self-start md:self-auto"
          >
            Explore All Companions →
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {(['All', 'Girlfriend', 'Boyfriend', 'Coffee', 'Events', 'Conversation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#E94B83] text-white shadow-md shadow-[#E94B83]/20 scale-105'
                  : 'bg-white text-[#6D315D] hover:text-[#E94B83] border border-[#F47B8F]/25 hover:border-[#E94B83]/40'
              }`}
            >
              {tab === 'Girlfriend' ? 'Rent Girlfriend' : tab === 'Boyfriend' ? 'Rent Boyfriend' : tab}
            </button>
          ))}
        </div>

        {/* Cards Grid / Mobile Horizontal Scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanions.map((comp) => {
            const roleLabel = comp.gender?.toLowerCase() === 'male' ? 'Rent Boyfriend' : 'Rent Girlfriend';
            return (
              <div
                key={comp.id}
                className="group bg-white rounded-3xl border border-[#F47B8F]/20 hover:border-[#E94B83]/50 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
              >
                {/* Photo Header */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={comp.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                    alt={comp.displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#292126]/70 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Profile
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#6D315D]/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                      {roleLabel}
                    </span>
                  </div>

                  {/* Location & Rating */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-bold">
                    <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                      <MapPin className="w-3.5 h-3.5 text-[#F47B8F]" />
                      <span>{comp.city.name}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{comp.averageRating > 0 ? comp.averageRating.toFixed(1) : '4.9'}</span>
                      <span className="text-slate-300 font-normal">({comp.totalReviews || 12})</span>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-extrabold text-[#292126] group-hover:text-[#6D315D] transition-colors">
                        {comp.displayName}, {comp.age}
                      </h3>
                      <div className="text-right">
                        <span className="text-[10px] text-[#756A70] uppercase font-bold tracking-wider block">Hourly Rate</span>
                        <span className="text-base font-black text-[#E94B83]">₹{comp.hourlyPrice}/hr</span>
                      </div>
                    </div>

                    {comp.bio && (
                      <p className="text-xs text-[#756A70] line-clamp-2 leading-relaxed mb-3 font-medium">
                        {comp.bio}
                      </p>
                    )}

                    {/* Activity Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {comp.activities.slice(0, 3).map((act, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] px-2.5 py-1 rounded-full"
                        >
                          {act.activity.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={comp.id.startsWith('demo') ? '/companions' : `/companions/${comp.username}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#E94B83] hover:bg-[#D43770] text-white text-xs font-extrabold py-3 rounded-xl shadow-md shadow-[#E94B83]/20 transition-all cursor-pointer"
                  >
                    View Profile & Availability →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is RentMate?',
      a: 'RentMate is India’s premier verified social companionship platform. It allows adults (18+) to rent companions by the hour for legitimate social experiences such as coffee dates, dining, movies, concerts, sightseeing, and public events.'
    },
    {
      q: 'How does renting a girlfriend or boyfriend work?',
      a: 'Register your account with a ₹399 one-time platform registration fee, browse photo ID verified companion profiles in your city, select your preferred date, activity, and time slot, and confirm your booking.'
    },
    {
      q: 'What does the ₹399 registration fee cover?',
      a: 'The ₹399 one-time registration fee covers platform onboarding, 18+ age verification, identity document checks, and lifelong access to discover companions on RentMate.'
    },
    {
      q: 'Are companion booking charges separate?',
      a: 'Yes. The ₹399 is the platform registration fee. The companion’s hourly booking rates (set individually by verified companions, e.g. ₹500–₹900/hr) are separate and paid upon booking.'
    },
    {
      q: 'How do I find a companion?',
      a: 'Use our discovery filters to browse by city (Mumbai, Delhi NCR, Bengaluru, Goa, Pune, Hyderabad), activity type, or companion preferences. Click "View Profile" to check galleries, bios, and availability.'
    },
    {
      q: 'Can I choose the type of experience?',
      a: 'Yes! You can choose companions for Coffee Dates, Fine Dining, Movie Dates, Concerts & Events, Art Galleries, Sightseeing, or Casual Conversations.'
    },
    {
      q: 'How are profiles verified?',
      a: 'All companions undergo government photo ID verification (Aadhaar/Passport/Driving License) before receiving a Verified Profile badge on the platform.'
    },
    {
      q: 'How does payment work?',
      a: 'All payments are processed securely via Razorpay. Platform registration and booking fees are clearly calculated with complete pricing transparency.'
    },
    {
      q: 'How is my information protected?',
      a: 'We enforce strict privacy standards. Phone numbers and email addresses are automatically masked in real-time platform chat to protect your personal details.'
    },
    {
      q: 'What are the platform rules?',
      a: 'All companion meetings MUST take place in public venues (cafes, restaurants, theaters, public event arenas). RentMate strictly prohibits sexual services, prostitution, harassment, and illegal activities.'
    }
  ];

  return (
    <section id="faqs" className="py-20 bg-[#FFF0F3] border-b border-[#F47B8F]/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full mb-3 shadow-sm">
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="text-[#756A70] text-sm mt-2 font-medium">
            Clear, transparent answers about RentMate platform, safety, and bookings.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#F47B8F]/25 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-extrabold text-[#292126] hover:text-[#6D315D] transition-colors"
                >
                  <span>{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-[#FFF0F3] text-[#6D315D] flex items-center justify-center shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#E94B83]" /> : <ChevronDown className="w-4 h-4 text-[#756A70]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-[#756A70] leading-relaxed border-t border-[#F47B8F]/15 pt-4 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function StickyMobileCTA() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#F47B8F]/30 p-3 px-4 backdrop-blur-xl flex items-center justify-between gap-3 shadow-2xl">
      <div>
        <span className="text-[10px] uppercase font-extrabold text-[#756A70] block tracking-wider">Platform Registration</span>
        <span className="text-sm font-black text-[#6D315D]">₹399 One-Time</span>
      </div>
      <Link
        href="/companions"
        className="bg-[#E94B83] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#E94B83]/30 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
      >
        Find Your Companion →
      </Link>
    </div>
  );
}
