import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Lock, Ban, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Paireva Prohibited Services Policy — Zero Tolerance Rules',
  description:
    'Official Prohibited Services Policy for Paireva. Explicit prohibitions on sexual services, escorting, prostitution, adult content, illegal acts, and minor access.',
};

export default async function ProhibitedServicesPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-8">
        {/* Header Title Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-md text-center space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-6 h-6 text-[#E94B83]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
            Prohibited Services Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#756A70] max-w-xl mx-auto font-medium">
            Zero-Tolerance Policy for Non-Social Activities, Sexual Conduct, and Illegal Behavior
          </p>
          <div className="pt-2 text-[11px] font-bold text-[#6D315D]">
            Last Updated: September 7, 2026 • Version 2.1
          </div>
        </div>

        {/* Notice Callout */}
        <div className="bg-[#FFF0F3] p-6 rounded-3xl border border-[#F47B8F]/40 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-[#6D315D] text-sm">
            <AlertTriangle className="w-5 h-5 text-[#E94B83] shrink-0" />
            CRITICAL PLATFORM NOTICE: SOCIAL COMPANIONSHIP ONLY
          </div>
          <p className="text-xs text-[#756A70] leading-relaxed font-medium">
            Paireva (<Link href="https://www.paireva.fun" className="text-[#E94B83] underline font-bold">www.paireva.fun</Link>) operates exclusively as an online social companionship marketplace. Paireva is <strong>NOT</strong> an escort agency, adult service, dating app, or sexual services directory. Any attempt to solicit, offer, or engage in sexual or unlawful acts result in immediate permanent ban, forfeiture of funds, and referral to law enforcement agencies.
          </p>
        </div>

        {/* Content Container */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-10 text-xs sm:text-sm leading-relaxed text-[#292126]">
          
          {/* Section A */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <Ban className="w-5 h-5 text-[#E94B83]" />
              Section A: Prohibition of Sexual Services & Escorting
            </h2>
            <p className="text-[#756A70]">
              Paireva strictly forbids the offering, solicitation, arrangement, or provision of any sexual acts or sexually explicit services.
            </p>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2 text-[#756A70] font-medium">
              <div className="font-bold text-[#6D315D] text-xs">Strictly Prohibited Conduct Includes:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Prostitution, commercial sex work, or paid intimate favors of any kind.</li>
                <li>Escorting services for sexual purposes or private adult bookings.</li>
                <li>Soliciting or offering sexual acts during messaging, phone calls, or in-person bookings.</li>
                <li>Requesting or offering companionship in private hotel rooms, private residences, or secluded non-public spaces.</li>
              </ul>
            </div>
          </section>

          {/* Section B */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#E94B83]" />
              Section B: Adult, Explicit, or Pornographic Content
            </h2>
            <p className="text-[#756A70]">
              All content hosted on Paireva—including profile pictures, bios, verification photos, and in-app messages—must conform to family-friendly, non-explicit standards.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#756A70] pl-2 font-medium">
              <li><strong>Nudity & Partial Nudity:</strong> No photos displaying nudity, lingerie, underwear, or sexually suggestive poses.</li>
              <li><strong>Explicit Text:</strong> No sexual innuendos, double entendres, adult terminology, or sexual service pricing.</li>
              <li><strong>External Media:</strong> No sharing of links to adult sites, OnlyFans, webcam sites, or sexually explicit social accounts.</li>
            </ul>
          </section>

          {/* Section C */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#E94B83]" />
              Section C: Human Exploitation & Trafficking
            </h2>
            <p className="text-[#756A70]">
              Paireva enforces an absolute zero-tolerance policy regarding human trafficking, forced labor, coercion, or exploitation of any individual.
            </p>
            <p className="text-[#756A70]">
              Every companion profile on Paireva must be created and operated voluntarily by the individual user. Any third-party management, agency pimping, or forced participation will trigger immediate law enforcement intervention under applicable criminal laws.
            </p>
          </section>

          {/* Section D */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#E94B83]" />
              Section D: Illegal Activities & Substance Abuse
            </h2>
            <p className="text-[#756A70]">
              Paireva bookings must strictly comply with all local, state, national, and international laws.
            </p>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2 text-[#756A70] font-medium">
              <div className="font-bold text-[#6D315D] text-xs">The following activities during bookings are illegal and prohibited:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Possession, consumption, or distribution of illegal drugs or controlled substances.</li>
                <li>Underage drinking or encouraging illegal substance abuse.</li>
                <li>Carrying unauthorized weapons, dangerous items, or illegal substances to bookings.</li>
                <li>Gambling, financial fraud, theft, or property damage during bookings.</li>
              </ul>
            </div>
          </section>

          {/* Section E */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#E94B83]" />
              Section E: Minor Safety & Age Restrictions (Strict 18+)
            </h2>
            <p className="text-[#756A70]">
              Paireva is strictly restricted to legal adults who are at least <strong>18 years of age</strong> (or the legal age of majority in your jurisdiction).
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#756A70] pl-2 font-medium">
              <li>Minors (under 18 years old) are strictly forbidden from creating accounts, browsing, or participating in bookings.</li>
              <li>Customers who attempt to book companions for minors or facilitate minor access will be reported to government child protection authorities.</li>
              <li>Companions must submit government ID verification confirming 18+ age prior to profile approval.</li>
            </ul>
          </section>

          {/* Section F */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#E94B83]" />
              Section F: Financial Abuse, Extortion & Off-Platform Transactions
            </h2>
            <p className="text-[#756A70]">
              To protect both customers and companions from financial scams and safety risks:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#756A70] pl-2 font-medium">
              <li><strong>No Cash Transactions:</strong> All payments for companion hourly rates must occur exclusively through the Paireva platform via Razorpay. Direct cash, UPI transfers outside platform, or crypto payments are strictly prohibited.</li>
              <li><strong>No Extortion:</strong> Any blackmail, harassment, or demand for extra money beyond the confirmed booking rate is prohibited.</li>
              <li><strong>No Advance Scams:</strong> Companions are forbidden from requesting money upfront prior to confirmed platform bookings.</li>
            </ul>
          </section>

          {/* Section G */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#E94B83]" />
              Section G: Monitoring, Enforcement & Reporting
            </h2>
            <p className="text-[#756A70]">
              Paireva employs automated content filtering, keyword detection, and human moderation teams to monitor platform activity.
            </p>
            <div className="bg-[#FFF0F3] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-2 text-[#756A70] font-medium">
              <div className="font-extrabold text-[#6D315D] text-xs">Consequences of Policy Violation:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Immediate account suspension or permanent termination without warning.</li>
                <li>Forfeiture of account registration fees and pending payout balances.</li>
                <li>Immediate report to state police, cybercrime units, and relevant law enforcement authorities.</li>
              </ul>
            </div>
          </section>

          {/* Section H */}
          <section className="space-y-4 border-t border-[#F47B8F]/20 pt-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-[#E94B83]" />
              Section H: Permitted Social Companionship Activities
            </h2>
            <p className="text-[#756A70]">
              For total clarity, Paireva is dedicated exclusively to wholesome, public social experiences. Permitted and encouraged companionship activities include:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#6D315D]">Dining & Coffee Dates</div>
                  <div className="text-[11px] text-[#756A70]">Sharing meals, trying new cafes, coffee talks, and restaurant outings.</div>
                </div>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#6D315D]">Events & Concerts</div>
                  <div className="text-[11px] text-[#756A70]">Attending music shows, theater, art galleries, and social gatherings.</div>
                </div>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#6D315D]">City Exploration & Movies</div>
                  <div className="text-[11px] text-[#756A70]">Sightseeing public attractions, shopping trips, and movie screenings.</div>
                </div>
              </div>

              <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#F47B8F]/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#6D315D]">Friendly Conversation</div>
                  <div className="text-[11px] text-[#756A70]">Having friendly discussions, language practice, and social networking.</div>
                </div>
              </div>
            </div>

            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 text-xs space-y-1 font-medium text-[#292126] mt-4">
              <div><strong>Safety / Compliance Contact:</strong> [LEGAL_ENTITY_NAME]</div>
              <div><strong>Safety Email:</strong> [SUPPORT_EMAIL]</div>
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
