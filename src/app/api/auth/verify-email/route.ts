import { NextResponse } from 'next/server';
import { getSessionUser, signToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyOTPHash } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { otp, userId, email } = body;

    const sessionUser = await getSessionUser();
    let targetUserId = sessionUser?.id || userId;
    let dbUser = null;

    if (targetUserId) {
      dbUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (email) {
      dbUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Check if already verified
    if (dbUser.isEmailVerified && dbUser.accountStatus === 'ACTIVE' && dbUser.isRegistrationFeePaid) {
      return NextResponse.json({
        success: true,
        message: 'Account is already verified.',
        isEmailVerified: true,
        accountStatus: 'ACTIVE',
        redirectTo: '/dashboard',
      });
    }

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
    // Account moves to PENDING_IDENTITY_VERIFICATION for CUSTOMER role (or ACTIVE for non-customers)
    const nextAccountStatus = dbUser.role === 'CUSTOMER' ? 'PENDING_IDENTITY_VERIFICATION' : 'ACTIVE';

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

    if (dbUser.role === 'CUSTOMER' && !dbUser.isRegistrationFeePaid) {
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_REQUIRED',
        code: 'PAYMENT_REQUIRED',
        message: 'Email verified successfully! Please complete the ₹399 registration fee to activate platform access.',
        isEmailVerified: true,
        isRegistrationFeePaid: false,
        accountStatus: 'PENDING_PAYMENT',
        paymentRequired: true,
        userId: dbUser.id,
        redirectTo: '/register?step=2',
      }, { status: 403 });
    }

    // Both payment AND email OTP are verified! Issue session JWT and set auth cookie now!
    const updatedToken = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      accountStatus: updatedUser.accountStatus,
      isEmailVerified: true,
    });

    setAuthCookie(updatedToken);

    const redirectPath = updatedUser.role === 'CUSTOMER' ? '/identity-verification' : '/dashboard';

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Please complete identity verification to proceed.',
      isEmailVerified: true,
      isRegistrationFeePaid: updatedUser.isRegistrationFeePaid,
      accountStatus: updatedUser.accountStatus,
      paymentRequired: false,
      redirectTo: redirectPath,
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to verify your email.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to verify email code. Please try again.' }, { status: 500 });
  }
}


