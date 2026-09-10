import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validators';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      include: {
        customerProfile: true,
        companionProfile: {
          include: { city: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if companion status is banned or suspended
    if (user.companionProfile) {
      const status = user.companionProfile.verificationStatus;
      if (status === 'BANNED' || status === 'SUSPENDED') {
        return NextResponse.json(
          { error: `Account has been ${status.toLowerCase()}. Please contact support.` },
          { status: 403 }
        );
      }
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // CUSTOMER ONBOARDING CHECKS
    if (user.role === 'CUSTOMER') {
      // 1. Unpaid registration fee check: DO NOT create session cookie
      if (!user.isRegistrationFeePaid) {
        return NextResponse.json(
          {
            error: 'PAYMENT_REQUIRED',
            code: 'PAYMENT_REQUIRED',
            message: 'Your registration is incomplete. Please complete the ₹399 registration fee payment to activate your account.',
            userId: user.id,
            email: user.email,
            isRegistrationFeePaid: false,
            isEmailVerified: user.isEmailVerified,
            redirectTo: '/register?step=2',
          },
          { status: 403 }
        );
      }

      // 2. Unverified email check: Dispatch new OTP code and DO NOT create session cookie
      if (!user.isEmailVerified || user.accountStatus === 'PENDING') {
        const { generateNumericOTP, hashOTP } = await import('@/lib/otp');
        const { sendVerificationOTP } = await import('@/lib/emailService');

        const otp = generateNumericOTP();
        const otpHash = await hashOTP(otp);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationOtpHash: otpHash,
            emailVerificationOtpExpiresAt: otpExpiresAt,
            emailVerificationAttempts: 0,
            emailVerificationLastSentAt: new Date(),
          },
        });

        const userName = user.customerProfile?.name || 'Valued Customer';
        await sendVerificationOTP(user.email, otp, userName);

        return NextResponse.json(
          {
            error: 'VERIFICATION_REQUIRED',
            code: 'VERIFICATION_REQUIRED',
            message: 'Your email address is not verified yet. A 6-digit verification code has been sent to your email.',
            userId: user.id,
            email: user.email,
            isRegistrationFeePaid: true,
            isEmailVerified: false,
            redirectTo: '/verify-email',
          },
          { status: 403 }
        );
      }
    }

    // Fully verified customer (or companion/admin): Create session cookie now
    if (user.accountStatus !== 'ACTIVE') {
      await prisma.user.update({
        where: { id: user.id },
        data: { accountStatus: 'ACTIVE' },
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });

    setAuthCookie(token);

    let targetRedirect = '/dashboard';
    if (user.role === 'ADMIN') {
      targetRedirect = '/admin';
    } else if (user.role === 'COMPANION') {
      targetRedirect = '/companion-dashboard';
    }

    return NextResponse.json({
      success: true,
      verificationRequired: false,
      redirectTo: targetRedirect,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: 'ACTIVE',
        isEmailVerified: user.isEmailVerified,
        isRegistrationFeePaid: user.isRegistrationFeePaid,
        customerProfile: user.customerProfile,
        companionProfile: user.companionProfile,
      },
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
