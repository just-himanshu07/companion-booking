'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rosebrand-100 flex items-center justify-center text-rosebrand-600 font-bold mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Invalid Reset Link</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          No password reset token was provided in the URL. Please request a new reset link.
        </p>
        <Link
          href="/forgot-password"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors inline-block"
        >
          Request Reset Link
        </Link>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">Password Reset Complete</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your password has been successfully updated. You can now log in to your Paireva account with your new password.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          Sign In to Your Account
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white font-bold mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Reset Your Password</h1>
        <p className="text-xs text-slate-500">Enter a new secure password for your account</p>
      </div>

      {error && (
        <div className="p-3 bg-rosebrand-50 border border-rosebrand-200 text-rosebrand-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Minimum 8 characters"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Re-enter new password"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center text-xs text-slate-500">Loading...</div>}>
          <ResetPasswordFormContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

