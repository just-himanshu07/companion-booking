'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

type PaymentStepStatus = 'IDLE' | 'CREATING_ORDER' | 'CHECKOUT_OPEN' | 'VERIFYING' | 'SUCCESS' | 'FAILURE';

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
  const [paymentStatus, setPaymentStatus] = useState<PaymentStepStatus>('IDLE');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    if (formData.age < 18) {
      setError('You must be at least 18 years old to register.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, termsAccepted }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setUserId(data.user.id);
      setStep(2); // Proceed to ₹399 fee payment step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayFee = async () => {
    setPaymentStatus('CREATING_ORDER');
    setError('');
    try {
      const orderRes = await fetch('/api/payments/registration-order', { method: 'POST' });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setPaymentStatus('FAILURE');
        throw new Error(orderData.error || 'Unable to start payment. Please try again.');
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
        setPaymentStatus('FAILURE');
        throw new Error('Unable to load Razorpay SDK. Please check your internet connection.');
      }

      setPaymentStatus('CHECKOUT_OPEN');

      // Initialize Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency || 'INR',
        name: 'Paireva',
        description: 'One-Time Platform Registration Fee',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setPaymentStatus('VERIFYING');
          try {
            // Verify payment with backend
            const verifyRes = await fetch('/api/payments/verify-registration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setPaymentStatus('SUCCESS');

              // Trigger Meta Pixel CompleteRegistration Conversion Event ONLY after verified server success
              if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'CompleteRegistration', {
                  value: verifyData.amount || orderData.amount,
                  currency: 'INR',
                });
              }

              // Hard redirect to dashboard ONLY after server verification success
              window.location.href = redirectTo || '/dashboard';
            } else {
              setPaymentStatus('FAILURE');
              setError(verifyData.error || 'Payment verification failed. Your account has not been activated. Please try again.');
            }
          } catch (verifyErr: any) {
            setPaymentStatus('FAILURE');
            setError('Payment verification failed. Your account has not been activated. Please try again.');
          }
        },
        prefill: {
          email: formData.email,
          contact: formData.phone,
          name: formData.name,
        },
        theme: {
          color: '#E94B83',
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus('IDLE');
            setError('Payment cancelled. Your registration has not been completed.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('[Razorpay Payment Failed Event]', {
          code: response?.error?.code,
          description: response?.error?.description,
          source: response?.error?.source,
          step: response?.error?.step,
          reason: response?.error?.reason,
        });
        setPaymentStatus('FAILURE');
        setError('Payment failed. Your account has not been activated. Please try again.');
      });
      rzp.open();
    } catch (err: any) {
      setPaymentStatus('FAILURE');
      setError(err.message || 'Unable to start payment. Please try again.');
    }
  };

  const getPayButtonText = () => {
    switch (paymentStatus) {
      case 'CREATING_ORDER':
        return 'Creating payment...';
      case 'CHECKOUT_OPEN':
        return 'Processing...';
      case 'VERIFYING':
        return 'Verifying payment...';
      case 'FAILURE':
        return 'Payment failed. Please try again.';
      case 'SUCCESS':
        return 'Redirecting to Dashboard...';
      default:
        return 'Pay ₹399 & Activate Account';
    }
  };

  const isPaymentDisabled = paymentStatus === 'CREATING_ORDER' || paymentStatus === 'CHECKOUT_OPEN' || paymentStatus === 'VERIFYING' || paymentStatus === 'SUCCESS';

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
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (18+)</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
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
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Mumbai"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Masked in Chat)</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="registerTermsAccepted"
                  name="termsAccepted"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                  aria-required="true"
                  aria-describedby={error ? "register-error" : undefined}
                />
                <label htmlFor="registerTermsAccepted" className="text-xs text-slate-600 leading-normal cursor-pointer select-none">
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
                  Pay the mandatory ₹399 one-time registration fee via Razorpay to activate your account and book verified companions.
                </p>
                <div className="text-3xl font-black text-slate-900 pt-2">₹399</div>
              </div>

              <button
                onClick={handlePayFee}
                disabled={isPaymentDisabled}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {getPayButtonText()}
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
