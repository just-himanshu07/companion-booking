import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ error: 'Missing required payment verification tokens' }, { status: 400 });
    }

    const isVerified = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid payment signature verification failed' }, { status: 400 });
    }

    // Transactional update to prevent race condition double payment
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { isRegistrationFeePaid: true },
      });

      await tx.payment.updateMany({
        where: { razorpayOrderId },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS',
        },
      });
    });

    await createNotification(
      user.id,
      'Registration Fee Verified',
      'Your ₹149 one-time registration fee has been successfully processed. You can now discover and book verified companions.',
      'PAYMENT',
      '/companions'
    );

    return NextResponse.json({
      success: true,
      message: 'Registration fee verified successfully',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}

