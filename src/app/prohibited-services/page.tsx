import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSessionUser } from '@/lib/auth';
import { AlertTriangle } from 'lucide-react';

export default async function ProhibitedServicesPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rosebrand-100 text-rosebrand-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Prohibited Services Policy</h1>
          <p className="text-xs text-slate-500">Zero Tolerance Policy for Non-Social Activities</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs leading-relaxed text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Core Purpose</h2>
            <p>
              Companion is designed exclusively for discovering and booking verified companions for legitimate, public social activities (dining out, movie screenings, music concerts, city sightseeing, cultural tours, and friendly coffee talks).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-rosebrand-700">2. Strictly Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Any form of sexual services, escorting, prostitution, or solicitation</li>
              <li>Explicit physical contact, sexual harassment, or verbal abuse</li>
              <li>Arranging meetings in private residences or non-public venues</li>
              <li>Illicit drug use, substance distribution, or illegal acts</li>
              <li>Human trafficking or exploitation of any kind</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Enforcement & Reporting</h2>
            <p>
              Our safety compliance team monitors reports 24/7. Accounts violating this policy face immediate lifetime bans, forfeiture of any pending funds, and report to law enforcement.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
