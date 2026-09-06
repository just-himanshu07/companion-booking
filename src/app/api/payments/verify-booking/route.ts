import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ error: 'Missing payment verification tokens' }, { status: 400 });
    }

    const isSignatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: { include: { user: true } },
        activity: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Booking status to CONFIRMED
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // 2. Update Payment record
      await tx.payment.updateMany({
        where: { razorpayOrderId },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS',
        },
      });

      // 3. Mark availability slot booked
      await tx.availabilitySlot.updateMany({
        where: {
          companionId: booking.companionId,
          date: booking.date,
          startTime: booking.startTime,
        },
        data: { isBooked: true },
      });

      // 4. Create internal conversation for customer <-> companion messaging
      await tx.conversation.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          bookingId: booking.id,
          customerId: booking.customerId,
          companionUserId: booking.companion.userId,
        },
      });
    });

    // Send notifications
    await createNotification(
      user.id,
      'Booking Confirmed!',
      `Your booking #${booking.bookingNumber} with ${booking.companion.displayName} for ${booking.activity.name} on ${booking.date} at ${booking.startTime} is confirmed.`,
      'BOOKING',
      '/profile'
    );

    await createNotification(
      booking.companion.userId,
      'New Booking Confirmed!',
      `You have a confirmed social booking #${booking.bookingNumber} for ${booking.activity.name} on ${booking.date} at ${booking.startTime}.`,
      'BOOKING',
      '/companion-dashboard'
    );

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully',
      bookingId: booking.id,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}

