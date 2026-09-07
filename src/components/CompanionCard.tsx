'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Star, MapPin, Heart, Calendar } from 'lucide-react';

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
}

export default function CompanionCard({ companion, isFavoriteInitial = false }: CompanionCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const isVerified = companion.verificationStatus === 'VERIFIED';
  const displayPhoto = companion.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
  const roleLabel = companion.gender?.toLowerCase() === 'male' ? 'Rent Boyfriend' : companion.gender?.toLowerCase() === 'female' ? 'Rent Girlfriend' : 'Companion';

  return (
    <div className="group bg-white rounded-3xl border border-[#F47B8F]/20 hover:border-[#E94B83]/50 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <Image
          src={displayPhoto}
          alt={companion.displayName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#292126]/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
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
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#292126] flex items-center justify-center backdrop-blur-md shadow-sm transition-transform active:scale-95"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-[#E94B83] text-[#E94B83]' : 'text-[#756A70] hover:text-[#E94B83]'
            } transition-colors`}
          />
        </button>

        {/* Rating and City Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
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
      </div>

      {/* Content */}
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

          {/* Activities Badges */}
          <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
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
        <Link
          href={`/companions/${companion.username}`}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#E94B83] hover:bg-[#D43770] text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-[#E94B83]/20"
        >
          <Calendar className="w-4 h-4" />
          View Profile & Availability →
        </Link>
      </div>
    </div>
  );
}
