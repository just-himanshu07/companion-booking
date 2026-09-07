import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Lock, AlertTriangle, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#6D315D] text-white border-t border-[#F47B8F]/20 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Safety Disclaimer Banner */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-5 sm:p-6 mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E94B83]/20 text-[#E94B83] flex items-center justify-center shrink-0 border border-[#E94B83]/30">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm">Strict Non-Sexual Policy & Code of Conduct</h4>
              <p className="text-xs text-rose-100/80 mt-0.5 max-w-3xl leading-relaxed">
                RentMate is a legitimate marketplace for public social activities (coffee dates, dining, movies, concerts, sightseeing, events). Sexual services, prostitution, solicitation, and harassment are strictly prohibited and result in immediate lifetime bans and legal reporting.
              </p>
            </div>
          </div>
          <Link
            href="/prohibited-services"
            className="text-xs font-extrabold bg-[#E94B83] hover:bg-[#D43770] text-white px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            Read Safety Policy
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E94B83] to-[#F47B8F] flex items-center justify-center text-white font-bold shadow-md">
                <Sparkles className="w-5 h-5 fill-white/20" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  Rent<span className="text-[#F47B8F]">Mate</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-200/80 block -mt-1">
                  Real People. Real Company.
                </span>
              </div>
            </Link>
            <p className="text-xs text-rose-100/80 leading-relaxed font-medium">
              India's premier verified companion booking marketplace for coffee dates, events, conversations, and social experiences in public settings.
            </p>
            <div className="flex items-center gap-3 text-xs text-rose-100/90 pt-1">
              <div className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Private & Discreet</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4 text-rose-200">Navigation</h5>
            <ul className="space-y-2.5 text-xs font-semibold text-rose-100/90">
              <li>
                <Link href="/#discover" className="hover:text-white transition-colors">
                  Discover Companions
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Safety Center
                </Link>
              </li>
              <li>
                <Link href="/#faqs" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4 text-rose-200">Legal</h5>
            <ul className="space-y-2.5 text-xs font-semibold text-rose-100/90">
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
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund Policy
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
            </ul>
          </div>

          {/* Cities & Social */}
          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4 text-rose-200">Popular Cities</h5>
            <ul className="space-y-2 text-xs font-semibold text-rose-100/90 mb-5">
              <li>Mumbai • Delhi NCR • Bengaluru</li>
              <li>Goa • Pune • Hyderabad</li>
            </ul>

            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-3 text-rose-200">Connect With Us</h5>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-rose-200/80 gap-4">
          <p>© {new Date().getFullYear()} RentMate Social Marketplace. All rights reserved. 18+ Only Platform.</p>
          <div className="flex items-center gap-1 font-medium text-rose-100">
            Made with <Heart className="w-3.5 h-3.5 text-[#E94B83] fill-[#E94B83] inline mx-0.5" /> for Authentic Companionship
          </div>
        </div>
      </div>
    </footer>
  );
}
