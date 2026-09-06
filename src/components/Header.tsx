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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rosebrand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-brand-900 to-rosebrand-600 bg-clip-text text-transparent">
                Companion
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-rosebrand-500 block -mt-1">
                Social Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {currentUser?.role === 'COMPANION' ? (
              <Link href="/companion-dashboard" className="hover:text-brand-600 transition-colors font-semibold text-brand-700">
                Companion Dashboard
              </Link>
            ) : (
              <Link href="/companions" className="hover:text-brand-600 transition-colors">
                Find Companions
              </Link>
            )}
            <Link href="/#how-it-works" className="hover:text-brand-600 transition-colors">
              How it Works
            </Link>
            <Link href="/safety" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety Center
            </Link>
            <Link href="/prohibited-services" className="hover:text-rosebrand-600 transition-colors text-xs bg-rosebrand-50 text-rosebrand-700 px-2.5 py-1 rounded-full font-medium">
              Strictly Non-Sexual
            </Link>
          </nav>

          {/* Desktop Auth / User Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 relative">
                {/* Notifications Link */}
                <Link
                  href="/profile?tab=notifications"
                  className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-full relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rosebrand-500 rounded-full border-2 border-white"></span>
                  )}
                </Link>

                {/* Messages Link */}
                <Link
                  href="/messages"
                  className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-full transition-colors"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* User Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-brand-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                      {(currentUser.customerProfile?.name || currentUser.companionProfile?.displayName || currentUser.email)[0].toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">
                      {currentUser.customerProfile?.name || currentUser.companionProfile?.displayName || 'My Account'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                          {currentUser.role}
                        </span>
                      </div>

                      {currentUser.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                        >
                          <ShieldCheck className="w-4 h-4 text-brand-600" />
                          Admin Dashboard
                        </Link>
                      )}

                      {currentUser.role === 'COMPANION' ? (
                        <Link
                          href="/companion-dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                        >
                          <UserIcon className="w-4 h-4 text-brand-600" />
                          Companion Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                        >
                          <UserIcon className="w-4 h-4 text-brand-600" />
                          My Profile & Bookings
                        </Link>
                      )}

                      <Link
                        href="/messages"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Conversations
                      </Link>

                      <Link
                        href="/profile?tab=favorites"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                      >
                        <Heart className="w-4 h-4 text-rosebrand-500" />
                        Favorites
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rosebrand-600 hover:bg-rosebrand-50 text-left font-medium"
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
                  href="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-brand-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/companions"
                  className="text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
                >
                  Find a Companion
                </Link>
                <Link
                  href="/register-companion"
                  className="text-sm font-semibold border border-slate-300 hover:border-slate-400 text-slate-800 px-4 py-2 rounded-lg transition-all hover:bg-slate-50"
                >
                  Become a Companion
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          {currentUser?.role === 'COMPANION' ? (
            <Link
              href="/companion-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-brand-700 py-2"
            >
              Companion Dashboard
            </Link>
          ) : (
            <Link
              href="/companions"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-800 hover:text-brand-600 py-2"
            >
              Find a Companion
            </Link>
          )}
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-slate-800 hover:text-brand-600 py-2"
          >
            How it Works
          </Link>
          <Link
            href="/safety"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-emerald-700 py-2"
          >
            Safety Center
          </Link>
          <Link
            href="/prohibited-services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-rosebrand-600 bg-rosebrand-50 p-2 rounded-lg"
          >
            Prohibited Services Policy (Non-Sexual)
          </Link>

          {currentUser ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase">Account</p>
              {currentUser.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-brand-600 py-1"
                >
                  Admin Dashboard
                </Link>
              )}
              {currentUser.role === 'COMPANION' ? (
                <Link
                  href="/companion-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-slate-800 py-1"
                >
                  Companion Dashboard
                </Link>
              ) : (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-slate-800 py-1"
                >
                  My Profile & Bookings
                </Link>
              )}
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-800 py-1"
              >
                Messages
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm font-semibold text-rosebrand-600 py-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 text-slate-700 font-semibold border border-slate-300 rounded-lg"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-sm"
              >
                Customer Sign Up (₹149)
              </Link>
              <Link
                href="/register-companion"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 bg-slate-900 text-white font-semibold rounded-lg"
              >
                Become a Companion
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

