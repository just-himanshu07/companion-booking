import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { ShieldCheck, Lock, Eye, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Paireva Privacy Policy — Data Protection & Privacy Practices',
  description:
    'Comprehensive Privacy Policy explaining how Paireva collects, uses, protects, and manages personal data in compliance with applicable standards.',
};

export default async function PrivacyPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-8">
        {/* Header Title Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-md text-center space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6 text-[#E94B83]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#756A70] max-w-xl mx-auto font-medium">
            How Paireva Collects, Uses, Safeguards, and Respects Your Personal Data
          </p>
          <div className="pt-2 text-[11px] font-bold text-[#6D315D]">
            Last Updated: September 7, 2026 • Version 2.1
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-10 text-xs sm:text-sm leading-relaxed text-[#292126]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              1. Platform Operator & Scope
            </h2>
            <p className="text-[#756A70]">
              This Privacy Policy applies to the website, mobile applications, APIs, and services operated under the brand name <strong>Paireva</strong> ("Paireva", "we", "us", or "our"), accessible at <Link href="https://www.paireva.fun/" className="text-[#E94B83] underline font-bold">https://www.paireva.fun/</Link>.
            </p>
            <p className="text-[#756A70]">
              Paireva is a companionship marketplace that facilitates connections and bookings for lawful, non-sexual companionship activities. This Privacy Policy explains what personal information we collect, why we collect it, how we use and protect it, when it may be shared with third-party service providers, and the rights and choices available to users regarding their personal information.
            </p>
            <p className="text-[#756A70]">
              By using Paireva, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              2. Categories of Information We Collect
            </h2>
            <p className="text-[#756A70]">
              We collect information that you directly provide to us, data generated during your platform usage, and technical information sent by your device:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs">A. Account & Registration Data</h4>
                <ul className="list-disc list-inside text-[#756A70] text-xs space-y-1 font-medium">
                  <li>Full name & display name</li>
                  <li>Email address & verified phone number</li>
                  <li>Age and date of birth (18+ eligibility)</li>
                  <li>Gender and preferred city location</li>
                  <li>Hashed password credentials</li>
                </ul>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs">B. Profile & Verification Data</h4>
                <ul className="list-disc list-inside text-[#756A70] text-xs space-y-1 font-medium">
                  <li>Profile photographs & gallery images</li>
                  <li>Short bio, languages, and activity tags</li>
                  <li>Hourly pricing & availability schedules</li>
                  <li>Government-issued ID documents (for companions)</li>
                </ul>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs">C. Booking & Transaction Identifiers</h4>
                <ul className="list-disc list-inside text-[#756A70] text-xs space-y-1 font-medium">
                  <li>Booking dates, start/end times, and duration</li>
                  <li>Razorpay Order IDs & Payment Transaction IDs</li>
                  <li>Transaction amounts & status indicators</li>
                  <li><em>(Raw card details are never stored)</em></li>
                </ul>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs">D. Usage & Analytics Technical Data</h4>
                <ul className="list-disc list-inside text-[#756A70] text-xs space-y-1 font-medium">
                  <li>IP address and device specifications</li>
                  <li>Browser type & operating system</li>
                  <li>Meta Pixel event logs (CompleteRegistration, Purchase)</li>
                  <li>In-app messages, reviews, and safety reports</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              3. Purpose of Processing & Use of Data
            </h2>
            <p className="text-[#756A70]">
              Paireva processes personal data strictly for legitimate operational, security, and contractual purposes, including:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#756A70] pl-2 font-medium">
              <li><strong>Account Operation:</strong> Creating, authenticating, and managing user accounts.</li>
              <li><strong>Marketplace Facilitation:</strong> Enabling customers to discover companions and complete bookings.</li>
              <li><strong>Payment Processing:</strong> Processing registration fees and booking charges via Razorpay.</li>
              <li><strong>Safety & Verification:</strong> Reviewing government IDs to verify companion identity and protect platform safety.</li>
              <li><strong>Fraud Prevention:</strong> Detecting duplicate transactions, unauthorized access, or policy violations.</li>
              <li><strong>Customer Support:</strong> Responding to user inquiries, disputes, and safety reports.</li>
              <li><strong>Measurement & Analytics:</strong> Tracking website conversions and improving user experience.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              4. Data Protection Framework (DPDP India)
            </h2>
            <p className="text-[#756A70]">
              Paireva respects applicable data protection principles, including India's Digital Personal Data Protection (DPDP) framework. Personal data is collected on lawful grounds (such as user consent and performance of service contract) and processed in a lawful, fair, and transparent manner.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              5. Payment Information & Security
            </h2>
            <p className="text-[#756A70]">
              Financial transactions on Paireva are processed through PCI-DSS compliant third-party payment gateways (Razorpay). <strong>Paireva does NOT store raw credit card numbers, debit card PINs, or CVV security codes on its servers.</strong> We store only payment status, transaction amounts, and gateway reference identifiers (`razorpayOrderId`, `razorpayPaymentId`).
            </p>
          </section>

          {/* Section 6 & 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              6. Cookies & Meta Pixel Conversion Tracking
            </h2>
            <p className="text-[#756A70]">
              Paireva uses essential cookies and tracking technologies to operate the platform:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li><strong>Essential Session Cookies:</strong> HTTP-only cookies (`auth_token`) to keep you securely logged in.</li>
              <li><strong>Meta Pixel (Pixel ID: 4369663456666110):</strong> We utilize Meta Pixel scripts to measure advertising effectiveness and track verified conversion events (such as `PageView`, `CompleteRegistration`, and `Purchase`). This helps us optimize marketing campaigns on Meta platforms (Facebook/Instagram).</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              7. Data Sharing & Third-Party Providers
            </h2>
            <p className="text-[#756A70]">
              We do NOT sell, rent, or trade your personal information. We share data only with authorized service providers necessary to operate the Platform:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li><strong>Razorpay:</strong> Payment processing and refund settlement.</li>
              <li><strong>Vercel & PostgreSQL:</strong> Cloud hosting, database infrastructure, and serverless compute.</li>
              <li><strong>Meta:</strong> Conversion measurement via Meta Pixel.</li>
              <li><strong>Law Enforcement & Regulators:</strong> When required by formal court order, subpoena, or legal obligation.</li>
            </ul>
          </section>

          {/* Section 9 & 10 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              8. Data Security & Technical Safeguards
            </h2>
            <p className="text-[#756A70]">
              We implement industry-standard administrative, technical, and physical security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li>HTTPS TLS encryption for all data in transit.</li>
              <li>Bcrypt password hashing for account credentials.</li>
              <li>Masked contact channels in initial in-app messaging.</li>
              <li>Restricted database access with environment secret isolation.</li>
            </ul>
          </section>

          {/* Section 11 & 12 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              9. User Rights & Account Deletion
            </h2>
            <p className="text-[#756A70]">
              You have rights regarding your personal information, including the right to access, review, update, or correct your profile data through your account dashboard.
            </p>
            <p className="text-[#756A70]">
              <strong>Account Deletion:</strong> If you wish to permanently delete your account and remove your personal profile from public discovery, please submit an account deletion request to <strong>[SUPPORT_EMAIL]</strong> from your registered email address. We will process your request after verifying identity, subject to legal record retention requirements.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              10. Children's Privacy (Strictly 18+ Only)
            </h2>
            <p className="text-[#756A70]">
              Paireva is strictly an adult social marketplace. We do not knowingly solicit or collect personal information from individuals under 18 years of age. If we become aware that a minor has registered an account, we will immediately terminate the account and delete associated data.
            </p>
          </section>

          {/* Section 14 */}
          <section className="space-y-3 border-t border-[#F47B8F]/20 pt-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              11. Grievance Redressal & Contact Mechanism
            </h2>
            <p className="text-[#756A70]">
              If you have questions, concerns, or complaints regarding data privacy or grievance redressal, please contact our Grievance Officer:
            </p>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 text-xs space-y-1 font-medium text-[#292126]">
              <div><strong>Entity:</strong> [LEGAL_ENTITY_NAME]</div>
              <div><strong>Grievance Officer:</strong> [GRIEVANCE_OFFICER_NAME]</div>
              <div><strong>Grievance Email:</strong> [GRIEVANCE_EMAIL]</div>
              <div><strong>Support Email:</strong> [SUPPORT_EMAIL]</div>
              <div><strong>Registered Address:</strong> [REGISTERED_ADDRESS]</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
