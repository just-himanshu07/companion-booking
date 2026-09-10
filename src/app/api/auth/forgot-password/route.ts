import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    const genericSuccessResponse = NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent to your email address.',
    });

    if (!email || typeof email !== 'string') {
      return genericSuccessResponse;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        customerProfile: { select: { name: true } },
        companionProfile: { select: { fullName: true } },
      },
    });

    if (!user || user.accountStatus === 'BANNED' || user.accountStatus === 'SUSPENDED') {
      return genericSuccessResponse;
    }

    // Determine user display name for email greeting
    const userName =
      user.customerProfile?.name ||
      user.companionProfile?.fullName ||
      undefined;

    // Generate cryptographically secure random 256-bit token (64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 1 hour (60 * 60 * 1000 ms)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate prior active reset tokens for this user and store new token hash
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);


    // Construct full reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

    // Send reset email via Resend email service
    await sendPasswordResetEmail(user.email, resetLink, userName);

    return genericSuccessResponse;
  } catch (err: any) {
    console.error('[API auth/forgot-password Error]', err);
    // Even in error cases, avoid leaking internal implementation details
    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent to your email address.',
      },
      { status: 200 }
    );
  }
}
