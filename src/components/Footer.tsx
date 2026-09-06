import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Lock, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Safety Disclaimer Banner */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 sm:p-6 mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rosebrand-500/20 text-rosebrand-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Strict Non-Sexual Policy & Code of Conduct</h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
                Companion is a legitimate marketplace for public social activities (dining, movies, concerts, sightseeing, events). Sexual services, prostitution, solicitation, trafficking, and harassment are strictly prohibited and will result in immediate lifetime bans and legal reporting.
              </p>
            </div>
          </div>
          <Link
            href="/prohibited-services"
            className="text-xs font-semibold bg-rosebrand-600 hover:bg-rosebrand-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Read Policy
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-4 h-4 fill-white/20" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Companion
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier verified companion booking marketplace for social activities, dining, events, and authentic human connection in public settings.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% ID Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4 text-brand-400" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Explore Marketplace</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/companions" className="hover:text-white transition-colors">
                  Find Verified Companions
                </Link>
              </li>
              <li>
                <Link href="/companions?city=mumbai" className="hover:text-white transition-colors">
                  Companions in Mumbai
                </Link>
              </li>
              <li>
                <Link href="/companions?city=delhi-ncr" className="hover:text-white transition-colors">
                  Companions in Delhi NCR
                </Link>
              </li>
              <li>
                <Link href="/companions?city=bengaluru" className="hover:text-white transition-colors">
                  Companions in Bengaluru
                </Link>
              </li>
              <li>
                <Link href="/companions?activity=fine-dining" className="hover:text-white transition-colors">
                  Fine Dining Partners
                </Link>
              </li>
              <li>
                <Link href="/register-companion" className="hover:text-white transition-colors text-brand-400 font-medium">
                  Become a Companion
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Trust & Safety</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/safety" className="hover:text-white transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Safety Center
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-white transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/prohibited-services" className="hover:text-white transition-colors">
                  Prohibited Services Policy
                </Link>
              </li>
              <li>
                <Link href="/safety#verification" className="hover:text-white transition-colors">
                  Identity Verification Process
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Report Misconduct / Grievances
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-white font-semibold text-sm mb-4">Legal & Policies</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Companion Social Marketplace. All rights reserved. 18+ Only Platform.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-rosebrand-500 fill-rosebrand-500" /> for Authentic Social Connection
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

