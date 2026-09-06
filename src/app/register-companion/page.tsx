'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CompanionRegisterPage() {
  const router = useRouter();
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    displayName: '',
    age: 22,
    gender: 'Female',
    cityId: '',
    hourlyPrice: 600,
    bio: 'Friendly, articulate, and culture-loving companion based in India. Happy to accompany you to fine dining, concerts, and cinema.',
    languages: ['English', 'Hindi'],
    interests: ['Fine Dining', 'Cinemas', 'Music'],
    activityIds: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch cities & activities from DB
    fetch('/api/companions/search')
      .then(() => {
        // Fetch static options
        setCities([
          { id: '1', name: 'Mumbai' },
          { id: '2', name: 'Delhi NCR' },
          { id: '3', name: 'Bengaluru' },
        ]);
      })
      .catch(() => {});
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.age < 18) {
      setError('Companions must be at least 18 years old.');
      return;
    }

    if (formData.activityIds.length === 0) {
      setError('Please select at least 1 activity you offer.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/companions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      alert('Companion registration submitted! Your profile is pending identity verification.');
      router.push('/companion-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivity = (id: string) => {
    if (formData.activityIds.includes(id)) {
      setFormData({ ...formData, activityIds: formData.activityIds.filter((a) => a !== id) });
    } else {
      setFormData({ ...formData, activityIds: [...formData.activityIds, id] });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12 w-full flex-1">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white font-bold mx-auto shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Become a Social Companion</h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Join India's premiere verified companion marketplace. Earn by accompanying clients to social activities, dining, and cultural events.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rosebrand-50 border border-rosebrand-200 text-rosebrand-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Aria Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name (Public)</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Aria S."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age (18+ Mandatory)</label>
                <input
                  type="number"
                  min={18}
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
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
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio & Description</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 h-24 resize-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Verification Guidance */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity Verification Notice
              </div>
              <p className="text-slate-600 leading-relaxed">
                After registration, you must upload government identity verification documents in your companion portal. Only approved profiles appear publicly.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting Application...' : 'Submit Companion Application'}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

