import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeedbackForm from '@/components/FeedbackForm';
import { getSessionUser } from '@/lib/auth';
import { MessageSquare, Sparkles, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Share Your Feedback — Paireva',
  description: 'Tell us about your experience, suggest new features, or report issues on Paireva.',
};

export default async function FeedbackPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login?redirectTo=/feedback');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#292126] selection:bg-[#E94B83] selection:text-white font-sans">
      <Header currentUser={currentUser} />

      <main className="flex-1 w-full py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-white border border-[#F47B8F]/30 text-[#6D315D] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-sm">
              <MessageSquare className="w-3.5 h-3.5 text-[#E94B83]" />
              <span>We Value Your Opinion</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292126] tracking-tight">
              Share Your Feedback
            </h1>
            <p className="text-xs sm:text-sm text-[#756A70] font-medium max-w-lg mx-auto leading-relaxed">
              Help us improve Paireva. Tell us what you liked, what went wrong, or what you'd like to see changed.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#F47B8F]/25 shadow-sm">
            <FeedbackForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

