'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || searchParams.get('redirectTo') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'PAYMENT_REQUIRED') {
          const targetUserId = data.userId || '';
          const targetEmail = data.email || email;
          window.location.href = `/register?step=2&userId=${targetUserId}&email=${encodeURIComponent(targetEmail)}`;
          return;
        }

        if (data.code === 'VERIFICATION_REQUIRED') {
          const targetUserId = data.userId || '';
          const targetEmail = data.email || email;
          window.location.href = `/verify-email?userId=${targetUserId}&email=${encodeURIComponent(targetEmail)}`;
          return;
        }

        throw new Error(data.message || data.error || 'Login failed');
      }

      // Determine redirect destination
      let target = '/dashboard';
      if (redirectTo) {
        target = redirectTo;
      } else if (data.user?.role === 'ADMIN') {
        target = '/admin';
      } else if (data.user?.role === 'COMPANION') {
        target = '/companion-dashboard';
      }

      // Hard redirect ensures cookie is sent with browser GET request
      window.location.href = target;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white font-bold mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome Back</h1>
        <p className="text-xs text-slate-500">Log in to your Companion account</p>
      </div>

      {error && (
        <div className="p-3 bg-rosebrand-50 border border-rosebrand-200 text-rosebrand-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-600 font-medium hover:underline">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            placeholder="Your password"
          />
        </div>

        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="loginTermsAccepted"
            name="termsAccepted"
            required
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
            aria-required="true"
            aria-describedby={error ? "login-error" : undefined}
          />
          <label htmlFor="loginTermsAccepted" className="text-xs text-slate-600 leading-normal cursor-pointer select-none">
            I agree to the{' '}
            <Link href="/terms" className="font-bold text-brand-600 hover:underline">
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold text-brand-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Signing In...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        Don't have an account?{' '}
        <Link href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'} className="font-bold text-brand-600 hover:underline">
          Register as Customer (₹399)
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center text-xs text-slate-500">Loading login...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
