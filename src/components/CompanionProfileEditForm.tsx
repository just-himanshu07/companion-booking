'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import PhotoUploadGallery from '@/components/PhotoUploadGallery';

interface CompanionProfileEditFormProps {
  initialProfile: {
    fullName: string;
    displayName: string;
    age: number;
    gender: string;
    cityId: string;
    hourlyPrice: number;
    bio: string;
    languages: string[];
    interests: string[];
    profilePhoto?: string | null;
    gallery: string[];
    activities: { activityId: string }[];
  };
  citiesList: { id: string; name: string }[];
  activitiesList: { id: string; name: string }[];
}

export default function CompanionProfileEditForm({
  initialProfile,
  citiesList,
  activitiesList,
}: CompanionProfileEditFormProps) {
  const [formData, setFormData] = useState({
    fullName: initialProfile.fullName || '',
    displayName: initialProfile.displayName || '',
    age: initialProfile.age || 22,
    gender: initialProfile.gender || 'Female',
    cityId: initialProfile.cityId || (citiesList[0]?.id ?? ''),
    hourlyPrice: initialProfile.hourlyPrice || 600,
    bio: initialProfile.bio || '',
    languagesInput: (initialProfile.languages || []).join(', '),
    interestsInput: (initialProfile.interests || []).join(', '),
    profilePhoto: initialProfile.profilePhoto || null,
    gallery: initialProfile.gallery || [],
    selectedActivityIds: initialProfile.activities.map((a) => a.activityId),
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleActivity = (id: string) => {
    if (formData.selectedActivityIds.includes(id)) {
      setFormData({
        ...formData,
        selectedActivityIds: formData.selectedActivityIds.filter((a) => a !== id),
      });
    } else {
      setFormData({
        ...formData,
        selectedActivityIds: [...formData.selectedActivityIds, id],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const languages = formData.languagesInput.split(',').map((s) => s.trim()).filter(Boolean);
      const interests = formData.interestsInput.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/companion/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          displayName: formData.displayName,
          age: formData.age,
          gender: formData.gender,
          cityId: formData.cityId,
          hourlyPrice: formData.hourlyPrice,
          bio: formData.bio,
          languages,
          interests,
          activityIds: formData.selectedActivityIds,
          profilePhoto: formData.profilePhoto,
          gallery: formData.gallery,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setMessage({ type: 'success', text: 'Companion profile updated successfully!' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rosebrand-50 text-rosebrand-800 border border-rosebrand-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* PHOTO UPLOAD & GALLERY SECTION */}
      <PhotoUploadGallery
        primaryPhoto={formData.profilePhoto}
        galleryPhotos={formData.gallery}
        onChange={({ primaryPhoto, galleryPhotos }) => {
          setFormData((prev) => ({
            ...prev,
            profilePhoto: primaryPhoto,
            gallery: galleryPhotos,
          }));
        }}
        maxPhotos={5}
        maxFileSizeMB={5}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name (Public)</label>
          <input
            type="text"
            required
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Age (18+)</label>
          <input
            type="number"
            min={18}
            required
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-Binary">Non-Binary</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate (₹)</label>
          <input
            type="number"
            min={100}
            step={50}
            required
            value={formData.hourlyPrice}
            onChange={(e) => setFormData({ ...formData, hourlyPrice: parseFloat(e.target.value) })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">City Location</label>
        <select
          value={formData.cityId}
          onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
        >
          {citiesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Public Bio & Description</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          required
          className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 h-28 resize-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Languages (Comma Separated)</label>
          <input
            type="text"
            value={formData.languagesInput}
            onChange={(e) => setFormData({ ...formData, languagesInput: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Interests (Comma Separated)</label>
          <input
            type="text"
            value={formData.interestsInput}
            onChange={(e) => setFormData({ ...formData, interestsInput: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Available Activities Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Offered Social Activities</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activitiesList.map((act) => {
            const isSelected = formData.selectedActivityIds.includes(act.id);
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => toggleActivity(act.id)}
                className={`p-2.5 rounded-xl border text-xs text-left font-semibold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{act.name}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving Changes...' : 'Save Profile & Rates'}
      </button>
    </form>
  );
}
