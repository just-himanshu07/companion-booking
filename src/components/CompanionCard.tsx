'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Star, MapPin, Heart, Calendar, Lock } from 'lucide-react';

interface CompanionCardProps {
  companion: {
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
  };
  isFavoriteInitial?: boolean;
  isLocked?: boolean;
  onLockedClick?: () => void;
}

export default function CompanionCard({
  companion,
  isFavoriteInitial = false,
  isLocked = false,
  onLockedClick,
}: CompanionCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLocked && onLockedClick) {
      onLockedClick();
      return;
    }

    setIsFavorite(!isFavorite);
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionId: companion.id }),
      });
    } catch (err) {
      setIsFavorite(isFavorite);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isLocked && onLockedClick) {
      e.preventDefault();
      e.stopPropagation();
      onLockedClick();
    }
  };

  const isVerified = companion.verificationStatus === 'VERIFIED';
  const displayPhoto = companion.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
  const roleLabel = companion.gender?.toLowerCase() === 'male' ? 'Rent Boyfriend' : companion.gender?.toLowerCase() === 'female' ? 'Rent Girlfriend' : 'Companion';

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-white rounded-3xl border border-[#F47B8F]/20 shadow-md transition-all duration-300 overflow-hidden flex flex-col ${
        isLocked
          ? 'cursor-pointer hover:border-[#E94B83]/60'
          : 'hover:border-[#E94B83]/50 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      {/* Photo Container — PHOTO ONLY IS BLURRED WHEN LOCKED */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <Image
          src={displayPhoto}
          alt={companion.displayName}
          fill
          className={`object-cover transition-transform duration-500 ${
            isLocked ? 'filter blur-md scale-105 select-none' : 'group-hover:scale-105'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Subtle Dark Translucent Overlay & Centered Lock Icon for Unverified Users */}
        {isLocked ? (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-3 z-20">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-lg mb-1.5 animate-pulse">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-extrabold text-white uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow">
              🔒 Verification Required
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-[#292126]/60 via-transparent to-transparent" />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          {isVerified && (
            <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-[#6D315D]/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm">
            {roleLabel}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#292126] flex items-center justify-center backdrop-blur-md shadow-sm transition-transform active:scale-95 z-10 cursor-pointer"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-[#E94B83] text-[#E94B83]' : 'text-[#756A70] hover:text-[#E94B83]'
            } transition-colors`}
          />
        </button>

        {/* Rating and City Overlay (If Unlocked) */}
        {!isLocked && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold z-10">
            <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <MapPin className="w-3.5 h-3.5 text-[#F47B8F]" />
              <span className="truncate">{companion.city.name}</span>
            </div>

            {companion.averageRating > 0 && (
              <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{companion.averageRating.toFixed(1)}</span>
                <span className="text-slate-300 font-normal">({companion.totalReviews})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Content — ALWAYS UNBLURRED & READABLE FOR UNVERIFIED USERS */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-lg font-extrabold text-[#292126] group-hover:text-[#6D315D] transition-colors truncate">
              {companion.displayName}, {companion.age}
            </h3>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#756A70] uppercase font-bold tracking-wider block">Hourly Rate</span>
              <span className="text-base font-black text-[#E94B83]">
                ₹{companion.hourlyPrice}/hr
              </span>
            </div>
          </div>

          {/* Location & Rating if locked */}
          {isLocked && (
            <div className="flex items-center justify-between text-xs font-bold text-[#756A70] my-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E94B83]" />
                <span>{companion.city.name}</span>
              </div>
              {companion.averageRating > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{companion.averageRating.toFixed(1)}</span>
                  <span className="text-[#756A70] font-normal">({companion.totalReviews})</span>
                </div>
              )}
            </div>
          )}

          {/* Activities Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
            {companion.activities.slice(0, 3).map((act, i) => (
              <span
                key={i}
                className="text-[11px] font-bold bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 px-2.5 py-0.5 rounded-full"
              >
                {act.activity.name}
              </span>
            ))}
            {companion.activities.length > 3 && (
              <span className="text-[11px] font-bold bg-[#FFF0F3] text-[#756A70] px-2 py-0.5 rounded-full">
                +{companion.activities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isLocked ? (
          <button
            onClick={handleCardClick}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#E94B83] hover:bg-[#D43770] text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-[#E94B83]/20 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Ask Availability →</span>
          </button>
        ) : (
          <Link
            href={`/companions/${companion.username}`}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#E94B83] hover:bg-[#D43770] text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-[#E94B83]/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Ask Availability →</span>
          </Link>
        )}
      </div>
    </div>
  );
}
