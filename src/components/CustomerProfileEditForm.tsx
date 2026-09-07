'use client';

import React, { useState } from 'react';
import { User, MapPin, Save, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import PhotoUploadGallery from '@/components/PhotoUploadGallery';

interface CustomerProfileEditFormProps {
  initialProfile: {
    name: string;
    age: number;
    gender?: string | null;
    city?: string | null;
    bio?: string | null;
    interests: string[];
    languages: string[];
    displayAvatar?: string | null;
    gallery?: string[];
  } | null;
}

export default function CustomerProfileEditForm({ initialProfile }: CustomerProfileEditFormProps) {
  const [formData, setFormData] = useState({
    name: initialProfile?.name || '',
    age: initialProfile?.age || 25,
    gender: initialProfile?.gender || 'Male',
    city: initialProfile?.city || '',
    bio: initialProfile?.bio || '',
    interestsInput: (initialProfile?.interests || []).join(', '),
    languagesInput: (initialProfile?.languages || []).join(', '),
    displayAvatar: initialProfile?.displayAvatar || null,
    gallery: initialProfile?.gallery || [],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const interests = formData.interestsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const languages = formData.languagesInput.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          city: formData.city,
          bio: formData.bio,
          interests,
          languages,
          displayAvatar: formData.displayAvatar,
          gallery: formData.gallery,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
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
        primaryPhoto={formData.displayAvatar}
        galleryPhotos={formData.gallery}
        onChange={({ primaryPhoto, galleryPhotos }) => {
          setFormData((prev) => ({
            ...prev,
            displayAvatar: primaryPhoto,
            gallery: galleryPhotos,
          }));
        }}
        maxPhotos={5}
        maxFileSizeMB={5}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Age (18+ Mandatory)</label>
          <input
            type="number"
            min={18}
            required
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Mumbai"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / About Yourself</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 h-20 resize-none focus:ring-2 focus:ring-brand-500"
          placeholder="Briefly describe your interests and background..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Interests (Comma Separated)</label>
          <input
            type="text"
            value={formData.interestsInput}
            onChange={(e) => setFormData({ ...formData, interestsInput: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Fine Dining, Tech, Movies"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Languages (Comma Separated)</label>
          <input
            type="text"
            value={formData.languagesInput}
            onChange={(e) => setFormData({ ...formData, languagesInput: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. English, Hindi"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving Changes...' : 'Save Profile Changes'}
      </button>
    </form>
  );
}
