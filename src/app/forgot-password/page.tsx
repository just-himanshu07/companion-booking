'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, ArrowRight, AlertCircle, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset. Please try again.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white font-bold mx-auto shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Forgot Password?</h1>
            <p className="text-xs text-slate-500">
              {submitted
                ? "We've sent password reset instructions to your email."
                : 'Enter your registered email address to receive a reset link.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rosebrand-50 border border-rosebrand-200 text-rosebrand-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-1">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-slate-900">Check your email inbox</p>
                <p className="text-slate-600 text-xs leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-900">{email}</span>, you will receive an email with instructions to reset your password within a few minutes.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/login"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </Link>
                
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
                >
                  Didn't receive an email? Try again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="name@example.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

