import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Paireva Refund & Cancellation Policy — Rules & Timeline',
  description:
    'Official Refund and Cancellation Policy governing registration fees, companion booking cancellations, and Razorpay refund timelines on Paireva.',
};

export default async function RefundPolicyPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-8">
        {/* Header Title Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-md text-center space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 flex items-center justify-center mx-auto shadow-sm">
            <RefreshCw className="w-6 h-6 text-[#E94B83]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#756A70] max-w-xl mx-auto font-medium">
            Clear, Transparent Refund Rules and Processing Timelines for Paireva Customers
          </p>
          <div className="pt-2 text-[11px] font-bold text-[#6D315D]">
            Last Updated: September 7, 2026 • Version 2.1
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-10 text-xs sm:text-sm leading-relaxed text-[#292126]">
          {/* Overview */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              1. Policy Overview & Scope
            </h2>
            <p className="text-[#756A70]">
              This Refund & Cancellation Policy describes the terms and procedures under which refunds are issued for platform registration fees and companion booking transactions conducted on Paireva (<Link href="https://www.paireva.fun" className="text-[#E94B83] underline font-bold">www.paireva.fun</Link>).
            </p>
            <p className="text-[#756A70]">
              All payments and refunds on Paireva are processed securely through our authorized payment gateway partner, <strong>Razorpay</strong>.
            </p>
          </section>

          {/* Registration Fee Refund Policy */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              2. One-Time Platform Registration Fee (₹399)
            </h2>
            <p className="text-[#756A70]">
              Paireva charges a mandatory one-time customer registration fee of <strong>₹399</strong>. This fee covers 18+ identity verification, safety checks, and lifetime platform discovery access.
            </p>
            <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 space-y-1 text-[#756A70] font-medium">
              <div className="font-bold text-[#6D315D] text-xs">Registration Fee Refund Rules:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Activated Accounts:</strong> Once a customer account has been verified and activated, the ₹399 registration fee is non-refundable.</li>
                <li><strong>Failed/Duplicate Debits:</strong> If a technical error or duplicate debit occurs during registration fee payment, the duplicate transaction will be refunded 100% automatically.</li>
              </ul>
            </div>
          </section>

          {/* Booking Cancellation & Refund Matrix */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              3. Companion Booking Cancellation & Refund Matrix
            </h2>
            <p className="text-[#756A70]">
              When you book a companion, payment is captured securely via Razorpay. Refund eligibility depends on cancellation timing and initiating party:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Scenario 1 */}
              <div className="bg-[#FFF0F3] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Customer Cancellation (&gt;24 Hours Notice)
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  If a customer cancels a booking more than 24 hours prior to the scheduled start time:
                </p>
                <div className="font-bold text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-200">
                  100% Full Refund Issued
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="bg-[#FFF0F3] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Customer Cancellation (&lt;24 Hours Notice)
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  If a customer cancels within 24 hours of the scheduled start time:
                </p>
                <div className="font-bold text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full inline-block border border-amber-200">
                  80% Refund (20% Companion Time Reservation Fee)
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="bg-[#FFF0F3] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Companion Cancellation
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  If a companion cancels a confirmed booking for any reason:
                </p>
                <div className="font-bold text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-200">
                  Automatic 100% Full Refund Issued Immediately
                </div>
              </div>

              {/* Scenario 4 */}
              <div className="bg-[#FFF0F3] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Platform Safety Cancellation
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  If Paireva cancels a booking due to safety or companion unavailability:
                </p>
                <div className="font-bold text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-200">
                  100% Full Refund Issued
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              4. No-Show & Late Arrival Rules
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-[#756A70] pl-2 font-medium">
              <li><strong>Customer No-Show:</strong> If a customer fails to arrive at the agreed venue within 30 minutes of the start time without prior notice, the booking is marked as a customer no-show and is non-refundable.</li>
              <li><strong>Companion No-Show:</strong> If a companion fails to arrive, the customer receives an immediate 100% full refund and the companion faces account review.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              5. Refund Method & Processing Timelines
            </h2>
            <p className="text-[#756A70]">
              Approved refunds are credited directly back to the original payment method used during checkout (UPI, Credit/Debit Card, Netbanking) via Razorpay.
            </p>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 text-xs space-y-2 font-medium">
              <div className="font-extrabold text-[#6D315D]">Razorpay Refund Timelines:</div>
              <ul className="list-disc list-inside space-y-1 text-[#756A70]">
                <li><strong>UPI Transactions:</strong> 1 to 3 business days.</li>
                <li><strong>Credit / Debit Cards:</strong> 5 to 7 business days (depending on issuing bank).</li>
                <li><strong>Netbanking:</strong> 3 to 5 business days.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t border-[#F47B8F]/20 pt-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              6. Dispute Resolution & Customer Support
            </h2>
            <p className="text-[#756A70]">
              If you experience any issue with a booking refund, duplicate charge, or payment dispute, please contact our support team:
            </p>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 text-xs space-y-1 font-medium text-[#292126]">
              <div><strong>Entity:</strong> [LEGAL_ENTITY_NAME]</div>
              <div><strong>Support Email:</strong> [SUPPORT_EMAIL]</div>
              <div><strong>Grievance Email:</strong> [GRIEVANCE_EMAIL]</div>
              <div><strong>Website:</strong> https://www.paireva.fun</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
