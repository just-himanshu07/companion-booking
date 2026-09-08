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

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
    });

    setAuthCookie(token);

    // If user paid fee but email is not verified, require email verification
    const isUnverified = user.isRegistrationFeePaid && (!user.isEmailVerified || user.accountStatus === 'PENDING');

    return NextResponse.json({
      success: true,
      verificationRequired: isUnverified,
      redirectTo: isUnverified ? '/verify-email' : '/dashboard',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
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
