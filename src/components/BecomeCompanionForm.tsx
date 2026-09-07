'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Sparkles, Heart, Clock } from 'lucide-react';

interface CityOption {
  id: string;
  name: string;
}

interface ActivityOption {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
}

interface BecomeCompanionFormProps {
  currentUser?: {
    id: string;
    email: string;
    role: string;
    customerProfile?: { name: string } | null;
    companionProfile?: { displayName: string; verificationStatus: string } | null;
  } | null;
  cities: CityOption[];
  activities: ActivityOption[];
}

export default function BecomeCompanionForm({ currentUser, cities, activities }: BecomeCompanionFormProps) {
  const router = useRouter();

  // Experience Options requested
  const experienceOptions = [
    { label: '☕ Coffee Date', keyword: 'coffee' },
    { label: '🎉 Event Companion', keyword: 'event' },
    { label: '💬 Conversation', keyword: 'conversation' },
    { label: '🍽️ Dining / Outing', keyword: 'dining' },
    { label: '🎬 Movie / Activity', keyword: 'movie' },
    { label: '🚶 Casual Outing', keyword: 'outing' },
    { label: '❤️ General Companionship', keyword: 'general' },
  ];

  const interestBadges = [
    'Fine Dining', 'Art & Museums', 'Indie Movies', 'Live Concerts',
    'Literature', 'Tech & Innovation', 'Travel & Heritage', 'Boutique Shopping',
    'Coffee Tasting', 'Fitness & Yoga'
  ];

  const [formData, setFormData] = useState({
    fullName: currentUser?.customerProfile?.name || '',
    displayName: currentUser?.customerProfile?.name || '',
    email: currentUser?.email || '',
    password: '',
    phone: '',
    age: 22,
    gender: 'Female',
    cityId: cities[0]?.id || '',
    hourlyPrice: 600,
    bio: 'Warm, articulate, and culture-loving companion. Passionate about great conversations, indie cinema, coffee, and formal events.',
    languages: ['English', 'Hindi'],
    interests: ['Fine Dining', 'Coffee Tasting', 'Art & Museums'],
    selectedExperiences: ['☕ Coffee Date', '💬 Conversation', '🍽️ Dining / Outing'],
    selectedActivityIds: activities.slice(0, 3).map((a) => a.id),
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const toggleExperience = (expLabel: string) => {
    if (formData.selectedExperiences.includes(expLabel)) {
      setFormData({
        ...formData,
        selectedExperiences: formData.selectedExperiences.filter((e) => e !== expLabel),
      });
    } else {
      setFormData({
        ...formData,
        selectedExperiences: [...formData.selectedExperiences, expLabel],
      });
    }
  };

  const toggleInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter((i) => i !== interest),
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict 18+ Validation
    if (formData.age < 18) {
      setError('Companions must be at least 18 years old to create a profile.');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('You must confirm that you are 18+ and agree to Paireva Companion Guidelines.');
      return;
    }

    if (!formData.fullName || !formData.displayName || !formData.cityId) {
      setError('Please fill in all required profile details.');
      return;
    }

    if (!currentUser && (!formData.email || !formData.password)) {
      setError('Email and password are required to create your account.');
      return;
    }

    setLoading(true);

    try {
      // Map selected experiences to available activity IDs
      let finalActivityIds = formData.selectedActivityIds;
      if (finalActivityIds.length === 0 && activities.length > 0) {
        finalActivityIds = activities.slice(0, 3).map((a) => a.id);
      }

      const res = await fetch('/api/companions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          activityIds: finalActivityIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile submission failed');

      setSubmittedStatus('Pending Review');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SUBMISSION SCREEN
  if (submittedStatus) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#F47B8F]/30 shadow-xl text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-2xl font-bold">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>

        <div className="space-y-2">
          <span className="inline-block bg-amber-100 text-amber-900 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
            Status: {submittedStatus}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292126]">
            Your companion profile has been submitted for review.
          </h2>
          <p className="text-xs sm:text-sm text-[#756A70] max-w-lg mx-auto leading-relaxed font-medium">
            Thank you for applying to become a Paireva Companion. Our team will review your profile and verification details. Only approved profiles appear publicly in discovery.
          </p>
        </div>

        <div className="p-4 bg-[#FFF8F5] rounded-2xl border border-[#F47B8F]/20 text-xs text-[#756A70] max-w-md mx-auto space-y-2 font-medium">
          <div className="flex items-center justify-center gap-1.5 font-bold text-[#6D315D]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> What Happens Next?
          </div>
          <p>
            1. Visit your Companion Dashboard to upload identity documents.<br />
            2. Our admin team completes verification within 24 hours.<br />
            3. Once approved, your profile becomes publicly discoverable.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/companion-dashboard"
            className="inline-flex items-center gap-2 bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold text-xs px-7 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Go to Companion Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-xl space-y-8">
      {/* Existing User Status Banner */}
      {currentUser?.companionProfile && (
        <div className="p-4 bg-[#FFF0F3] border border-[#F47B8F]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#6D315D]">
            <Sparkles className="w-4 h-4 text-[#E94B83]" />
            <span>Existing Companion Profile Status: <strong className="uppercase">{currentUser.companionProfile.verificationStatus}</strong></span>
          </div>
          <Link
            href="/companion-dashboard"
            className="bg-[#6D315D] text-white font-bold px-3.5 py-1.5 rounded-xl text-[11px] hover:bg-[#58264A]"
          >
            Manage Dashboard →
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name & Display Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">First / Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
              placeholder="e.g. Aria Sharma"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Display Name (Public) *</label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
              placeholder="e.g. Aria S."
            />
          </div>
        </div>

        {/* Account Auth Fields (If not logged in) */}
        {!currentUser && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FFF0F3] rounded-2xl border border-[#F47B8F]/20">
            <div>
              <label className="block text-xs font-extrabold text-[#6D315D] mb-1.5">Account Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#6D315D] mb-1.5">Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
                placeholder="At least 8 characters"
              />
            </div>
          </div>
        )}

        {/* Age, Gender, City, Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Age (18+ Mandatory) *</label>
            <input
              type="number"
              min={18}
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 18 })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-Binary">Non-Binary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">City *</label>
            <select
              value={formData.cityId}
              onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
              placeholder="+91 9876543210"
            />
          </div>
        </div>

        {/* Hourly Rate & Profile Photo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Hourly Rate (₹/hr) *</label>
            <input
              type="number"
              min={100}
              step={50}
              required
              value={formData.hourlyPrice}
              onChange={(e) => setFormData({ ...formData, hourlyPrice: parseFloat(e.target.value) || 500 })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Profile Photo URL</label>
            <input
              type="url"
              value={formData.profilePhoto}
              onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-bold text-[#292126] rounded-xl border border-[#F47B8F]/30 focus:ring-2 focus:ring-[#E94B83]"
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        {/* Companion Experience Types */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#292126]">
            Companion Experience Types Offered *
          </label>
          <div className="flex flex-wrap gap-2.5">
            {experienceOptions.map((exp) => {
              const selected = formData.selectedExperiences.includes(exp.label);
              return (
                <button
                  type="button"
                  key={exp.label}
                  onClick={() => toggleExperience(exp.label)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#E94B83] text-white border-[#E94B83] shadow-md shadow-[#E94B83]/20'
                      : 'bg-[#FFF8F5] text-[#292126] border-[#F47B8F]/30 hover:bg-[#FFF0F3]'
                  }`}
                >
                  {exp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#292126]">
            Interests & Conversation Topics
          </label>
          <div className="flex flex-wrap gap-2">
            {interestBadges.map((interest) => {
              const selected = formData.interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#6D315D] text-white border-[#6D315D]'
                      : 'bg-white text-[#756A70] border-slate-200 hover:border-[#F47B8F]'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-extrabold text-[#292126] mb-1.5">Short Bio & Personality *</label>
          <textarea
            required
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-3 bg-[#FFF8F5] text-xs font-medium text-[#292126] rounded-xl border border-[#F47B8F]/30 h-28 resize-none focus:ring-2 focus:ring-[#E94B83]"
            placeholder="Tell clients a little about your background, interests, and what kind of public social date experiences you enjoy..."
          />
        </div>

        {/* Mandatory 18+ Checkbox */}
        <div className="p-4 bg-[#FFF8F5] border border-[#F47B8F]/30 rounded-2xl space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-[#E94B83] rounded border-slate-300 focus:ring-[#E94B83]"
            />
            <span className="text-xs font-extrabold text-[#292126] leading-relaxed">
              I confirm that I am 18 years or older and agree to Paireva's Companion Guidelines and Non-Sexual Policy.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold py-4 rounded-2xl text-sm shadow-lg shadow-[#E94B83]/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          {loading ? 'Creating Companion Profile...' : 'Create Companion Profile →'}
        </button>
      </form>
    </div>
  );
}
