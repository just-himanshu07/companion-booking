import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid or missing reset token.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetTokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset link.' },
        { status: 400 }
      );
    }

    if (resetTokenRecord.usedAt !== null) {
      return NextResponse.json(
        { error: 'This password reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date() > resetTokenRecord.expiresAt) {
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password using bcrypt (cost factor 10, matching existing auth logic)
    const newPasswordHash = await bcrypt.hash(password, 10);

    // Update user password & mark token as used in atomic transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);


    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('[API auth/reset-password Error]', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    );
  }
}
