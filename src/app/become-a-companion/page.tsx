import React from 'react';

export const dynamic = 'force-dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BecomeCompanionForm from '@/components/BecomeCompanionForm';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck, Sparkles, AlertTriangle, Heart, Coffee, Calendar, CheckCircle2 } from 'lucide-react';

export default async function BecomeCompanionPage() {
  const currentUser = await getSessionUser();

  const [cities, activities] = await Promise.all([
    prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.activity.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, category: true },
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-8">
        {/* Page Title & Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-[#E94B83]" />
            <span>Join the Paireva Community</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#292126] tracking-tight">
            Become a <span className="font-serif italic text-[#6D315D]">Paireva Companion</span>
          </h1>

          <p className="text-sm sm:text-base text-[#756A70] leading-relaxed font-medium">
            Create your profile and let people discover you for coffee dates, events, conversations and shared experiences.
          </p>
        </div>

        {/* Safety Notice Card */}
        <div className="bg-white border border-[#F47B8F]/30 p-4 sm:p-5 rounded-2xl shadow-sm flex items-start gap-3 text-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#E94B83] border border-[#F47B8F]/30 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#E94B83]" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#292126]">Strict Safety & Non-Sexual Platform Guidelines</h4>
            <p className="text-[#756A70] mt-0.5 leading-relaxed font-medium">
              Paireva is a companionship platform. Sexual services, illegal activities and prohibited arrangements are not allowed. All meetings take place in safe public venues.
            </p>
          </div>
        </div>

        {/* Companion Registration Form Component */}
        <BecomeCompanionForm
          currentUser={currentUser}
          cities={cities}
          activities={activities}
        />
      </div>

      <Footer />
    </div>
  );
}

