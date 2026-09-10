import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required payment verification parameters' }, { status: 400 });
    }

    // 1. Fetch existing payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment order record not found' }, { status: 404 });
    }

    // 2. Validate ownership & payment type
    if (payment.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized payment verification attempt' }, { status: 403 });
    }

    if (payment.paymentType !== 'REGISTRATION_FEE') {
      return NextResponse.json({ error: 'Invalid payment type for registration verification' }, { status: 400 });
    }

    // 3. Idempotency Check: return success if already captured
    if (payment.status === 'SUCCESS' && user.isRegistrationFeePaid) {
      if (!user.isEmailVerified || user.accountStatus === 'PENDING') {
        return NextResponse.json({
          success: true,
          message: 'Registration fee already verified. Please complete email verification.',
          amount: payment.amount,
          verificationRequired: true,
          redirectTo: '/verify-email',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Registration fee already verified',
        amount: payment.amount,
        verificationRequired: false,
        redirectTo: '/dashboard',
      });
    }

    // 4. Verify Razorpay Signature
    const isVerified = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isVerified) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', errorReason: 'Signature verification failed' },
      });
      return NextResponse.json({ error: 'Payment verification failed. Your account has not been activated. Please try again.' }, { status: 400 });
    }

    // 5. Generate 6-digit OTP and store hash/expiration
    const { generateNumericOTP, hashOTP } = await import('@/lib/otp');
    const { sendVerificationOTP } = await import('@/lib/emailService');

    const otp = generateNumericOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 6. Transactional update to mark payment success and store OTP credentials
    const nextAccountStatus = user.isEmailVerified ? 'ACTIVE' : 'PENDING';

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          isRegistrationFeePaid: true,
          accountStatus: nextAccountStatus,
          emailVerificationOtpHash: otpHash,
          emailVerificationOtpExpiresAt: otpExpiresAt,
          emailVerificationAttempts: 0,
          emailVerificationLastSentAt: new Date(),
        },
      });


      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS',
          errorReason: null,
        },
      });

      // Remove registration fee reminder notification for paid user
      await tx.notification.deleteMany({
        where: {
          userId: user.id,
          title: 'Welcome to Companion Marketplace!',
        },
      });
    });

    // Send email using Resend
    const name = user.customerProfile?.name || 'Valued User';
    await sendVerificationOTP(user.email, otp, name);

    await createNotification(
      user.id,
      'Registration Fee Verified',
      `Your ₹${payment.amount} one-time registration fee has been successfully processed. Please verify your email to unlock platform access.`,
      'PAYMENT',
      '/verify-email'
    );

    return NextResponse.json({
      success: true,
      message: 'Registration fee verified. Email verification code sent.',
      amount: payment.amount,
      paymentSuccessful: true,
      isEmailVerified: false,
      accountStatus: 'PENDING',
      verificationRequired: true,
      redirectTo: '/verify-email',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Payment verification processing failed' }, { status: 500 });
  }
}

