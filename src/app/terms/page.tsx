import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { ShieldCheck, Lock, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Paireva Terms & Conditions — Official User Agreement',
  description:
    'Comprehensive Terms and Conditions governing the use of Paireva, India’s premier verified social companionship marketplace.',
};

export default async function TermsPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-8">
        {/* Header Title Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#F47B8F]/30 shadow-md text-center space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 flex items-center justify-center mx-auto shadow-sm">
            <FileText className="w-6 h-6 text-[#E94B83]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-[#756A70] max-w-xl mx-auto font-medium">
            Official Platform User Agreement & Operational Terms for Paireva Social Marketplace
          </p>
          <div className="pt-2 text-[11px] font-bold text-[#6D315D]">
            Last Updated: September 7, 2026 • Version 2.1
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#F47B8F]/20 shadow-sm space-y-10 text-xs sm:text-sm leading-relaxed text-[#292126]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D] flex items-center gap-2">
              <span>1. Introduction & Acceptance of Terms</span>
            </h2>
            <p className="text-[#756A70]">
              Welcome to <strong>Paireva</strong>, accessible at <Link href="https://www.paireva.fun/" className="text-[#E94B83] underline font-bold">https://www.paireva.fun/</Link>.
            </p>
            <p className="text-[#756A70]">
              Paireva is a companionship marketplace that facilitates connections and bookings for lawful, non-sexual companionship activities.
            </p>
            <p className="text-[#756A70]">
              By accessing, registering for, or using the Paireva website and its services (collectively, the "Platform"), you confirm that you have read, understood, and agree to be bound by these Terms & Conditions ("Terms"). If you do not agree with these Terms, you must not access or use the Platform.
            </p>
            <p className="text-[#756A70]">
              These Terms govern your use of the Platform, including account registration, companion profiles, bookings, payments, communications, reviews, and other services made available through Paireva.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              2. Nature of the Service
            </h2>
            <p className="text-[#756A70]">
              Paireva operates solely as a <strong>technology marketplace platform</strong> that facilitates discovery, communication, and scheduling between independent users ("Customers") seeking social companionship and independent service providers ("Companions") offering permitted social companionship services.
            </p>
            <div className="bg-[#FFF0F3] p-4 rounded-2xl border border-[#F47B8F]/30 space-y-2 text-[#6D315D] font-medium text-xs">
              <div className="font-extrabold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#E94B83]" /> Key Platform Disclaimers:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#756A70]">
                <li>Paireva does not employ companions; companions operate as independent contractors.</li>
                <li>Paireva does not guarantee that any booking request will be accepted or completed.</li>
                <li>Paireva does not guarantee personal compatibility, chemistry, or satisfaction between users.</li>
                <li>Platform verification checks (such as identity document review) do not constitute an endorsement, guarantee, or certification of a person's behavior, safety, character, or future conduct.</li>
                <li>Users remain solely responsible for their own personal decisions, interactions, and conduct.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              3. Permitted Companion Services
            </h2>
            <p className="text-[#756A70]">
              Services booked through Paireva are strictly limited to legitimate, lawful, public social companionship activities. Examples of permitted activities include:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#756A70] pl-2 font-medium">
              <li>Coffee meetings and casual cafe conversations</li>
              <li>Fine dining, food tasting, and restaurant accompaniment</li>
              <li>Attending public social events, concerts, theater, and cinema screenings</li>
              <li>City sightseeing, heritage walks, and public museum tours</li>
              <li>Personal shopping assistance and fashion/style guidance</li>
              <li>Attending professional conferences, business mixers, and public summits</li>
              <li>General non-sexual social accompaniment in public venues</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-[#FFF0F3]/60 p-6 rounded-2xl border border-[#F47B8F]/30">
            <h2 className="text-base sm:text-lg font-extrabold text-[#E94B83] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#E94B83]" />
              <span>4. Strict Prohibition of Sexual & Unlawful Services</span>
            </h2>
            <p className="text-[#292126] font-semibold">
              Paireva maintains an absolute ZERO-TOLERANCE POLICY regarding sexual services, escorting, prostitution, solicitation, human trafficking, or unlawful activities of any kind.
            </p>
            <p className="text-[#756A70]">
              The Platform does NOT facilitate, permit, or tolerate:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] font-medium">
              <li>Sexual intercourse, sexual contact, or sexual favors for compensation</li>
              <li>Prostitution, soliciting prostitution, or commercial sex work</li>
              <li>Escorting services involving explicit physical contact or sexual activity</li>
              <li>Paid adult performances, explicit photography, or nude modeling</li>
              <li>Human trafficking, forced labor, or exploitation</li>
            </ul>
            <p className="text-[#756A70] pt-1">
              <strong>Enforcement Action:</strong> Any user attempting to solicit, offer, negotiate, or engage in prohibited services will face <strong>immediate lifetime account termination</strong>, forfeiture of pending platform payments where legally permissible, and immediate referral to law enforcement authorities.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              5. User Accounts & Security
            </h2>
            <p className="text-[#756A70]">
              To access booking features, you must register a customer or companion account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li>Provide accurate, truthful, and complete information during registration.</li>
              <li>Maintain the security and confidentiality of your account credentials.</li>
              <li>Never create fake identities, upload fraudulent verification documents, or impersonate others.</li>
              <li>Never share, transfer, or sell your account to another individual.</li>
              <li>Notify Paireva immediately at <strong>[SUPPORT_EMAIL]</strong> if you suspect unauthorized access.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              6. Companion Profiles & Responsibilities
            </h2>
            <p className="text-[#756A70]">
              Companions registering on Paireva represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li>All profile details, photos, age, hourly rates, and activity tags are genuine and accurate.</li>
              <li>Photographs uploaded are authentic representations of the companion.</li>
              <li>Services offered comply strictly with non-sexual companionship guidelines and applicable laws.</li>
              <li>Required identity verification documents submitted to Paireva are genuine government-issued IDs.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              7. Customer Conduct & Code of Respect
            </h2>
            <p className="text-[#756A70]">
              Customers using Paireva agree to treat all companions with dignity, courtesy, and respect. Customers shall not:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li>Harass, threaten, stalk, coerce, intimidate, or discriminate against any companion.</li>
              <li>Request sexual favors, explicit physical contact, or private room meetings.</li>
              <li>Photograph, film, audio-record, or broadcast a companion without explicit written consent.</li>
              <li>Pressure companions to extend bookings off-platform or engage in unsafe conduct.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              8. Booking Rules & Venue Guidelines
            </h2>
            <p className="text-[#756A70]">
              Bookings must be scheduled in advance through the Platform. Both parties must adhere to the following operational rules:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li><strong>Public Venues Only:</strong> Initial social engagements must take place in public, accessible commercial venues (cafes, restaurants, theaters, public event halls).</li>
              <li><strong>Punctuality:</strong> Both parties must arrive on time for scheduled bookings. Late arrival does not automatically extend the booking duration.</li>
              <li><strong>Early Termination:</strong> Either party may terminate a booking immediately if they feel unsafe, uncomfortable, or if platform policies are violated.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              9. Payments & Platform Fees
            </h2>
            <p className="text-[#756A70]">
              All financial transactions on Paireva are conducted in Indian Rupees (INR) and processed securely through authorized payment gateways (e.g., Razorpay).
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#756A70] pl-2 font-medium">
              <li><strong>Registration Fee:</strong> Customers pay a mandatory one-time registration fee of ₹399 to unlock lifetime discovery and booking access.</li>
              <li><strong>Booking Charges:</strong> Booking fees are calculated based on the companion's hourly rate and duration, and are authorized/captured at the time of booking.</li>
              <li><strong>No Card Storage:</strong> Paireva does not store raw credit/debit card numbers or CVV codes on its servers. Payments are handled via Razorpay's PCI-DSS compliant infrastructure.</li>
            </ul>
          </section>

          {/* Section 10 & 11 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              10. Refunds & Cancellations
            </h2>
            <p className="text-[#756A70]">
              Booking cancellations and refund requests are strictly governed by our dedicated <Link href="/refund-policy" className="text-[#E94B83] underline font-bold">Refund & Cancellation Policy</Link>. Cancellations made more than 24 hours prior to booking start time receive a 100% refund. Companion-initiated cancellations always trigger an automatic 100% refund.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              11. Reviews & Ratings
            </h2>
            <p className="text-[#756A70]">
              Users may submit reviews following completed bookings. Reviews must reflect honest, genuine experiences. Users shall not submit defamatory, abusive, fake, or extortionist reviews. Paireva reserves the right to moderate or remove reviews violating community standards.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              12. In-App Messaging
            </h2>
            <p className="text-[#756A70]">
              The Platform provides masked messaging features to coordinate booking logistics. Messaging must remain professional, respectful, and non-sexual. Phone numbers and personal contact channels are automatically masked in initial chats to protect user privacy.
            </p>
          </section>

          {/* Section 14 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              13. User Generated Content
            </h2>
            <p className="text-[#756A70]">
              By posting content (profile text, bios, photos, reviews) on Paireva, you grant Paireva a non-exclusive, worldwide, royalty-free license to use, display, and format your content for platform operation. You retain ownership of your original photos.
            </p>
          </section>

          {/* Section 15 & 16 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              14. Safety Expectations & Identity Verification
            </h2>
            <p className="text-[#756A70]">
              Paireva performs identity document verification for companion profiles. However, verification verifies identity documents only and does not constitute a guarantee of future conduct. Users should exercise personal safety precautions, inform trusted contacts when meeting someone new, and contact local emergency services immediately in an emergency.
            </p>
          </section>

          {/* Section 17 & 18 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              15. Prohibited Conduct & Account Termination
            </h2>
            <p className="text-[#756A70]">
              Detailed conduct rules are set forth in our <Link href="/prohibited-services" className="text-[#E94B83] underline font-bold">Prohibited Services Policy</Link> and <Link href="/community-guidelines" className="text-[#E94B83] underline font-bold">Community Guidelines</Link>. Paireva reserves the right to suspend or terminate any user account at any time without notice for policy violations, fraud, safety concerns, or legal requirements.
            </p>
          </section>

          {/* Section 19 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              16. Intellectual Property
            </h2>
            <p className="text-[#756A70]">
              The Paireva name, logo, software, design system, source code, and trademarks are the exclusive intellectual property of <strong>[LEGAL_ENTITY_NAME]</strong>. Unauthorized copying, scraping, or reproduction is strictly prohibited.
            </p>
          </section>

          {/* Section 20 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              17. Third-Party Services
            </h2>
            <p className="text-[#756A70]">
              The Platform integrates third-party services including Razorpay (payment processing), Next.js / Vercel (cloud infrastructure), and Meta Pixel (measurement/analytics). Your interaction with third-party providers is subject to their respective terms and privacy policies.
            </p>
          </section>

          {/* Section 21 & 22 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              18. Disclaimers & Limitation of Liability
            </h2>
            <p className="text-[#756A70]">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PAIREVA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. PAIREVA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM OR USER INTERACTIONS.
            </p>
          </section>

          {/* Section 23 & 24 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              19. Governing Law & Jurisdiction
            </h2>
            <p className="text-[#756A70]">
              These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any legal dispute or court proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>[JURISDICTION]</strong>, India.
            </p>
          </section>

          {/* Section 25 */}
          <section className="space-y-3 border-t border-[#F47B8F]/20 pt-6">
            <h2 className="text-base sm:text-lg font-extrabold text-[#6D315D]">
              20. Contact Information & Grievance Redressal
            </h2>
            <p className="text-[#756A70]">
              For support inquiries, legal notices, or policy questions, please contact us:
            </p>
            <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F47B8F]/30 text-xs space-y-1 font-medium text-[#292126]">
              <div><strong>Entity:</strong> [LEGAL_ENTITY_NAME]</div>
              <div><strong>Support Email:</strong> [SUPPORT_EMAIL]</div>
              <div><strong>Grievance Officer Email:</strong> [GRIEVANCE_EMAIL]</div>
              <div><strong>Registered Address:</strong> [REGISTERED_ADDRESS]</div>
              <div><strong>Website:</strong> https://www.paireva.fun</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
