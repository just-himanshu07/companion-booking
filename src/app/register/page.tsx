'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

function CustomerRegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || searchParams.get('redirectTo') || '';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: 21,
    city: 'Mumbai',
    gender: 'Male',
    phone: '',
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.age < 18) {
      setError('You must be at least 18 years old to register.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setUserId(data.user.id);
      setStep(2); // Proceed to ₹149 fee payment step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = async () => {
    setLoading(true);
    setError('');
    try {
      const orderRes = await fetch('/api/payments/registration-order', { method: 'POST' });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // Verify payment with backend
      const verifyRes = await fetch('/api/payments/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: `pay_reg_${Date.now()}`,
          razorpaySignature: `mock_sig_reg_${Date.now()}`,
        }),
      });

      if (verifyRes.ok) {
        alert('One-time ₹399 Registration fee verified successfully! Welcome to Paireva.');
        window.location.href = redirectTo || '/companions';
      } else {
        setError('Payment verification failed.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white font-bold mx-auto shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Create Customer Account</h1>
            <p className="text-xs text-slate-500">18+ Adult Social Companion Marketplace</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-brand-600 text-white' : 'bg-emerald-500 text-white'}`}>
              1
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rosebrand-50 border border-rosebrand-200 text-rosebrand-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="name@example.com"
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
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="+91 9876543210"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Continue to Registration Fee (Step 2)'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">One-Time Registration Fee</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pay the mandatory ₹149 one-time registration fee via Razorpay to activate your account and book verified companions.
                </p>
                <div className="text-3xl font-black text-slate-900 pt-2">₹149</div>
              </div>

              <button
                onClick={handlePayFee}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying Payment...' : 'Pay ₹149 & Activate Account'}
              </button>
            </div>
          )}

          <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="font-bold text-brand-600 hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CustomerRegisterPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-500">Loading registration...</div>}>
      <CustomerRegisterFormContent />
    </React.Suspense>
  );
}

