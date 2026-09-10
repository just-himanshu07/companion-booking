import { NextResponse } from 'next/server';
import { requireAuth, signToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyOTPHash } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const sessionUser = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Check if already verified
    if (dbUser.isEmailVerified && dbUser.accountStatus === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'Account is already verified.',
        isEmailVerified: true,
        accountStatus: 'ACTIVE',
      });
    }

    const body = await req.json().catch(() => ({}));
    const { otp } = body;

    // Validate 6-digit numeric input format
    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit verification code.' },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();

    // Check attempt limits (max 5 failed attempts per OTP code)
    if (dbUser.emailVerificationAttempts >= 5) {
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if OTP hash and expiration exist
    if (!dbUser.emailVerificationOtpHash || !dbUser.emailVerificationOtpExpiresAt) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check expiration (10 minutes)
    if (new Date() > new Date(dbUser.emailVerificationOtpExpiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Compare hash securely
    const isValid = await verifyOTPHash(cleanOtp, dbUser.emailVerificationOtpHash);

    if (!isValid) {
      // Increment attempt counter
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          emailVerificationAttempts: { increment: 1 },
        },
      });

      const remainingAttempts = 5 - (dbUser.emailVerificationAttempts + 1);
      return NextResponse.json(
        {
          error: remainingAttempts > 0
            ? `Invalid verification code. ${remainingAttempts} attempts remaining.`
            : 'Invalid verification code. Maximum attempts exceeded. Please request a new code.',
        },
        { status: 400 }
      );
    }

    // OTP is valid! Mark email as verified and clear OTP secrets
    // Account becomes ACTIVE only if registration fee is paid (or for non-customer roles)
    const shouldActivate = dbUser.role !== 'CUSTOMER' || dbUser.isRegistrationFeePaid;
    const nextAccountStatus = shouldActivate ? 'ACTIVE' : 'PENDING';

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        isEmailVerified: true,
        accountStatus: nextAccountStatus,
        emailVerificationOtpHash: null,
        emailVerificationOtpExpiresAt: null,
        emailVerificationAttempts: 0,
      },
    });

    // Re-issue updated JWT token with computed accountStatus and isEmailVerified: true
    const updatedToken = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      accountStatus: updatedUser.accountStatus,
      isEmailVerified: true,
    });

    setAuthCookie(updatedToken);

    if (dbUser.role === 'CUSTOMER' && !dbUser.isRegistrationFeePaid) {
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully! Please complete the ₹399 registration fee to activate platform access.',
        isEmailVerified: true,
        isRegistrationFeePaid: false,
        accountStatus: 'PENDING',
        paymentRequired: true,
        redirectTo: '/register?step=2',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to Paireva.',
      isEmailVerified: true,
      isRegistrationFeePaid: updatedUser.isRegistrationFeePaid,
      accountStatus: updatedUser.accountStatus,
      paymentRequired: false,
      redirectTo: '/dashboard',
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to verify your email.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to verify email code. Please try again.' }, { status: 500 });
  }
}

