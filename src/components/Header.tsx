'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, User as UserIcon, LogOut, Menu, X, Heart, MessageSquare, Calendar, Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentUser?: {
    id: string;
    email: string;
    role: string;
    isRegistrationFeePaid: boolean;
    customerProfile?: { name: string } | null;
    companionProfile?: { displayName: string; username: string; verificationStatus: string } | null;
  } | null;
}

export default function Header({ currentUser }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            const unread = data.notifications.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-rose-100/70 py-3'
          : 'bg-[#FFF8F5]/80 backdrop-blur-sm border-b border-[#F47B8F]/20 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D315D] to-[#E94B83] flex items-center justify-center text-white shadow-md shadow-[#E94B83]/20 group-hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-[#6D315D] group-hover:text-[#E94B83] transition-colors">
                Rent<span className="text-[#E94B83]">Mate</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#756A70] block -mt-1">
                Real People. Real Company.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-bold text-[#6D315D]">
            {currentUser?.role === 'COMPANION' ? (
              <Link href="/companion-dashboard" className="hover:text-[#E94B83] transition-colors text-[#E94B83]">
                Companion Dashboard
              </Link>
            ) : (
              <Link href="/#discover" className="hover:text-[#E94B83] transition-colors">
                Discover
              </Link>
            )}
            <Link href="/#how-it-works" className="hover:text-[#E94B83] transition-colors">
              How It Works
            </Link>
            <Link href="/become-a-companion" className="hover:text-[#E94B83] transition-colors text-[#E94B83]">
              Become a Companion
            </Link>
            <Link href="/safety" className="hover:text-[#E94B83] transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety
            </Link>
            <Link href="/#faqs" className="hover:text-[#E94B83] transition-colors">
              FAQs
            </Link>
          </nav>

          {/* Desktop Auth & Primary CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 relative">
                {/* Notifications Link */}
                <Link
                  href="/profile?tab=notifications"
                  className="p-2 text-[#756A70] hover:text-[#6D315D] hover:bg-[#FFF0F3] rounded-full relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E94B83] rounded-full ring-2 ring-white"></span>
                  )}
                </Link>

                {/* Messages Link */}
                <Link
                  href="/messages"
                  className="p-2 text-[#756A70] hover:text-[#6D315D] hover:bg-[#FFF0F3] rounded-full transition-colors"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* User Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 text-xs font-bold text-[#6D315D] hover:bg-[#FFF0F3] p-1.5 px-3.5 rounded-full border border-[#F47B8F]/30 bg-white shadow-sm transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6D315D] to-[#E94B83] text-white flex items-center justify-center font-bold text-xs">
                      {(currentUser.customerProfile?.name || currentUser.companionProfile?.displayName || currentUser.email)[0].toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">
                      {currentUser.customerProfile?.name || currentUser.companionProfile?.displayName || 'My Account'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-60 bg-white border border-[#F47B8F]/20 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-widest">Signed in as</p>
                        <p className="text-xs font-bold text-[#292126] truncate mt-0.5">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-extrabold bg-[#FFF0F3] text-[#6D315D] border border-[#F47B8F]/30 px-2 py-0.5 rounded">
                          {currentUser.role}
                        </span>
                      </div>

                      {currentUser.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#6D315D] hover:bg-[#FFF0F3]"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#E94B83]" />
                          Admin Dashboard
                        </Link>
                      )}

                      {currentUser.role === 'COMPANION' ? (
                        <Link
                          href="/companion-dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#6D315D] hover:bg-[#FFF0F3]"
                        >
                          <UserIcon className="w-4 h-4 text-[#E94B83]" />
                          Companion Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link
                            href="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#6D315D] hover:bg-[#FFF0F3]"
                          >
                            <UserIcon className="w-4 h-4 text-[#E94B83]" />
                            My Profile & Bookings
                          </Link>
                          <Link
                            href="/become-a-companion"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#E94B83] hover:bg-[#FFF0F3]"
                          >
                            <Sparkles className="w-4 h-4 text-[#E94B83]" />
                            Become a Companion
                          </Link>
                        </>
                      )}

                      <Link
                        href="/messages"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#6D315D] hover:bg-[#FFF0F3]"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Conversations
                      </Link>

                      <Link
                        href="/profile?tab=favorites"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#6D315D] hover:bg-[#FFF0F3]"
                      >
                        <Heart className="w-4 h-4 text-[#E94B83]" />
                        Favorites
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/become-a-companion"
                  className="text-xs font-bold text-[#6D315D] hover:text-[#E94B83] px-3.5 py-2.5 rounded-xl border border-[#F47B8F]/30 bg-white hover:bg-[#FFF0F3] transition-colors"
                >
                  Become a Companion
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#6D315D] hover:text-[#E94B83] px-3.5 py-2.5 rounded-xl hover:bg-[#FFF0F3] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/companions"
                  className="text-xs font-extrabold bg-[#E94B83] hover:bg-[#D43770] text-white px-5 py-2.5 rounded-xl shadow-md shadow-[#E94B83]/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Find a Companion →
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#6D315D] hover:bg-[#FFF0F3] rounded-xl border border-[#F47B8F]/30 bg-white shadow-sm"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#F47B8F]/20 bg-white/98 backdrop-blur-2xl px-5 pt-3 pb-8 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-xl">
          <Link
            href="/#discover"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-bold text-[#6D315D] hover:text-[#E94B83] py-2"
          >
            Discover
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-bold text-[#6D315D] hover:text-[#E94B83] py-2"
          >
            How It Works
          </Link>
          <Link
            href="/become-a-companion"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-bold text-[#E94B83] py-2"
          >
            Become a Companion
          </Link>
          <Link
            href="/safety"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-bold text-emerald-700 py-2"
          >
            Safety Center
          </Link>
          <Link
            href="/#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-bold text-[#6D315D] hover:text-[#E94B83] py-2"
          >
            FAQs
          </Link>

          {currentUser ? (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-widest">Account</p>
              {currentUser.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-bold text-[#E94B83] py-1"
                >
                  Admin Dashboard
                </Link>
              )}
              {currentUser.role === 'COMPANION' ? (
                <Link
                  href="/companion-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-bold text-[#6D315D] py-1"
                >
                  Companion Dashboard
                </Link>
              ) : (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-bold text-[#6D315D] py-1"
                >
                  My Profile & Bookings
                </Link>
              )}
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#6D315D] py-1"
              >
                Messages
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm font-bold text-rose-600 py-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link
                href="/companions"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3 bg-[#E94B83] text-white font-extrabold text-sm rounded-xl shadow-md"
              >
                Find Your Companion →
              </Link>
              <Link
                href="/become-a-companion"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 text-[#6D315D] bg-[#FFF0F3] border border-[#F47B8F]/30 font-bold text-sm rounded-xl"
              >
                Become a Companion →
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 text-[#6D315D] font-bold text-sm hover:text-[#E94B83]"
              >
                Log In to Your Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
