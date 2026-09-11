'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldAlert, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface AccessLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  accountStatus?: string;
  rejectionReason?: string | null;
}

export default function AccessLockedModal({
  isOpen,
  onClose,
  title = 'Access Locked',
  message = 'You will access Discover and marketplace features after your account verification is approved.',
  accountStatus,
  rejectionReason,
}: AccessLockedModalProps) {
  if (!isOpen) return null;

  const isRejected = accountStatus === 'REJECTED';
  const isPendingIdentity = accountStatus === 'PENDING_IDENTITY_VERIFICATION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-[#F47B8F]/30 shadow-2xl p-6 sm:p-8 space-y-6 text-center overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6D315D] via-[#E94B83] to-[#F47B8F]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#756A70] hover:text-[#292126] hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-[#FFF0F3] border border-[#F47B8F]/30 text-[#E94B83] flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        {/* Header Title & Description */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF0F3] text-[#6D315D] text-[11px] font-extrabold rounded-full border border-[#F47B8F]/30 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-[#E94B83]" />
            Verification Gate Enforced
          </span>
          <h2 className="text-2xl font-black text-[#292126] tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-[#756A70] font-medium leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Status Callout Box */}
        {isRejected ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs space-y-1.5 text-rose-900">
            <div className="font-extrabold text-rose-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Identity Verification Rejected</span>
            </div>
            <p className="text-slate-700 text-[11px]">
              Reason: <span className="font-semibold text-rose-800">{rejectionReason || 'Uploaded ID document or selfie was unclear.'}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Please submit clear government ID documents and a well-lit live selfie to re-verify.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-[#FFF8F5] border border-[#F47B8F]/25 rounded-2xl text-left text-xs space-y-2 text-[#756A70]">
            <div className="flex items-center justify-between font-bold text-[#6D315D]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Account Status:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-amber-100 text-amber-800 border border-amber-200">
                {accountStatus === 'UNDER_REVIEW'
                  ? 'Under Review'
                  : accountStatus === 'PENDING_IDENTITY_VERIFICATION'
                  ? 'Verification Required'
                  : 'Unapproved Account'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Our admin compliance team manually reviews submitted ID documents to ensure platform safety. Full marketplace access will unlock automatically upon approval.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {isRejected || isPendingIdentity ? (
            <Link
              href="/identity-verification"
              onClick={onClose}
              className="w-full bg-[#E94B83] hover:bg-[#D43770] text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-[#E94B83]/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <span>{isRejected ? 'Resubmit Identity Verification' : 'Verify Identity Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}

          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-[#292126] font-extrabold py-3 rounded-2xl transition-colors text-xs cursor-pointer"
          >
            Okay, Got It
          </button>
        </div>
      </div>
    </div>
  );
}

