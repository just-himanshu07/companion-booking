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
      return NextResponse.json({
        success: true,
        message: 'Registration fee already verified',
        amount: payment.amount,
      });
    }

    // 4. Verify Razorpay Signature
    const isVerified = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isVerified) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', errorReason: 'Signature verification failed' },
      });
      return NextResponse.json({ error: 'Invalid payment signature verification failed' }, { status: 400 });
    }

    // 5. Transactional update to activate account and mark payment success
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { isRegistrationFeePaid: true },
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
    });

    await createNotification(
      user.id,
      'Registration Fee Verified',
      `Your ₹${payment.amount} one-time registration fee has been successfully processed. You can now discover and book verified companions.`,
      'PAYMENT',
      '/companions'
    );

    return NextResponse.json({
      success: true,
      message: 'Registration fee verified successfully',
      amount: payment.amount,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Payment verification processing failed' }, { status: 500 });
  }
}

