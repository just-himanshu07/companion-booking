import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { ShieldCheck, Heart, AlertTriangle, MessageSquare, CheckCircle2, PhoneCall } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Paireva Community Guidelines — Respect, Safety & Behavior Standards',
  description:
    'Official Community Standards and Safety Code of Conduct for Paireva customers and companions.',
};

export default async function CommunityGuidelinesPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-8">
        {/* Header Title Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-md text-center space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-6 h-6 text-[#E94B83] fill-[#E94B83]/20" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
            Community Guidelines
          </h1>
          <p className="text-xs sm:text-sm text-[#756A70] max-w-xl mx-auto font-medium">
            Building a Respectful, Safe, and Non-Sexual Companionship Environment for Everyone
          </p>
          <div className="pt-2 text-[11px] font-bold text-[#6D315D]">
            Last Updated: September 7, 2026 • Version 2.1
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-10 text-xs sm:text-sm leading-relaxed text-[#292126]">
          {/* Intro */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              1. Our Core Promise: Authentic Social Companionship
            </h2>
            <p className="text-[#756A70]">
              Paireva is founded on the belief that genuine social company makes life better. Whether you are looking for someone to grab coffee with, attend an event with, or share a great conversation with, our community thrives on mutual respect, clear boundaries, and authentic social experiences.
            </p>
            <p className="text-[#756A70]">
              These Community Guidelines apply to all users — both customers and companions — across all platform interactions (profiles, messages, bookings, and in-person social dates).
            </p>
          </section>

          {/* Core Rules Grid */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              2. Core Behavior Standards & Rules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> 1. Treat Everyone with Dignity & Respect
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  Politeness, punctuality, and good communication are mandatory. Treat your companion or client with the same respect you expect.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> 2. Respect Physical Boundaries & Consent
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  Personal space and physical boundaries must be respected at all times. Physical contact must strictly be consensual and non-sexual.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> 3. Strictly Non-Sexual Platform
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  Sexual solicitation, asking for sexual favors, prostitution, or adult escorting are strictly prohibited and result in immediate lifetime bans.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> 4. Public Venues Only
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  All initial bookings must take place in public, well-lit commercial venues (cafes, restaurants, theaters, public event spaces).
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> 5. Authentic Profiles & Photos
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  No catfishing, fake names, or misleading photos. Companions must use genuine, accurate photos of themselves.
                </p>
              </div>

              <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 space-y-1.5">
                <h4 className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> 6. Honest & Fair Reviews
                </h4>
                <p className="text-[#756A70] text-xs leading-relaxed font-medium">
                  Reviews must reflect genuine experiences. Extortion, fake negative reviews, or review manipulation are strictly prohibited.
                </p>
              </div>
            </div>
          </section>

          {/* Zero Tolerance Conduct */}
          <section className="space-y-3 bg-[#FFF0F3] p-6 rounded-2xl border border-[#F47B8F]/30">
            <h2 className="text-base sm:text-lg font-extrabold text-[#E94B83] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#E94B83]" />
              <span>3. Zero Tolerance Violations</span>
            </h2>
            <p className="text-[#756A70]">
              The following behaviors result in immediate account suspension, permanent platform bans, and reporting to legal authorities:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] font-medium">
              <li><strong>Sexual Solicitation & Commercial Sex:</strong> Offering or asking for sexual services.</li>
              <li><strong>Harassment & Threats:</strong> Verbal abuse, intimidation, stalking, or unwanted aggressive messages.</li>
              <li><strong>Underage Participation:</strong> Allowing anyone under 18 to use the Platform.</li>
              <li><strong>Financial Scams & Off-Platform Fee Evasion:</strong> Asking for off-platform bank transfers or advance cash scams.</li>
              <li><strong>Unconsented Recording:</strong> Filming or audio-recording companions without written permission.</li>
              <li><strong>Illegal Drugs & Weapons:</strong> Bringing illicit substances or weapons to a booking.</li>
            </ul>
          </section>

          {/* Practical Safety Tips */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              4. Practical Safety Recommendations
            </h2>
            <div className="space-y-2 text-[#756A70]">
              <p>For your comfort and peace of mind when meeting someone new:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 font-medium">
                <li>Always meet in public, well-trafficked commercial venues.</li>
                <li>Share your booking details and meeting location with a trusted friend or family member.</li>
                <li>Keep initial communication inside Paireva's secure in-app messaging center.</li>
                <li>Arrange your own transportation to and from the venue.</li>
                <li>Trust your instincts — if a situation feels uncomfortable, end the meeting immediately.</li>
              </ul>
            </div>
          </section>

          {/* How to Report & Emergency Notice */}
          <section className="space-y-3 border-t border-[#F47B8F]/20 pt-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              5. How to Report Violations & Emergency Notice
            </h2>
            <p className="text-[#756A70]">
              If you encounter inappropriate behavior, harassment, or policy violations:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li>Use the <strong>"Report User"</strong> or <strong>"Report Message"</strong> button in the app.</li>
              <li>Email our moderation team directly at <strong>[SUPPORT_EMAIL]</strong>.</li>
            </ul>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/40 space-y-2 mt-3">
              <div className="font-extrabold text-[#6D315D] text-xs flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-600" /> Immediate Emergency Situations:
              </div>
              <p className="text-xs text-[#756A70] leading-relaxed font-medium">
                If you are in immediate danger, face physical threats, or require urgent assistance, <strong>please contact your local police emergency services immediately (Dial 112 or 100 in India)</strong>. Do not rely solely on platform support in emergency situations.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
