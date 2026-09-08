import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateNumericOTP, hashOTP } from '@/lib/otp';
import { sendVerificationOTP } from '@/lib/emailService';

export async function POST() {
  try {
    const sessionUser = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { customerProfile: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (dbUser.isEmailVerified && dbUser.accountStatus === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is already verified.' },
        { status: 400 }
      );
    }

    const now = Date.now();

    // 1. Rate Limit Cooldown: 60 seconds between resends
    if (dbUser.emailVerificationLastSentAt) {
      const lastSentTime = new Date(dbUser.emailVerificationLastSentAt).getTime();
      const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);
      if (elapsedSeconds < 60) {
        const cooldownRemaining = 60 - elapsedSeconds;
        return NextResponse.json(
          { error: `Please wait ${cooldownRemaining} seconds before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    // 2. Generate new 6-digit numeric OTP (invalidates previous OTP)
    const newOtp = generateNumericOTP();
    const newOtpHash = await hashOTP(newOtp);
    const newOtpExpiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        emailVerificationOtpHash: newOtpHash,
        emailVerificationOtpExpiresAt: newOtpExpiresAt,
        emailVerificationAttempts: 0,
        emailVerificationLastSentAt: new Date(now),
      },
    });

    // 3. Send email using Resend SDK
    const name = dbUser.customerProfile?.name || 'Valued User';
    const emailResult = await sendVerificationOTP(dbUser.email, newOtp, name);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to resend verification code.' }, { status: 500 });
  }
}

