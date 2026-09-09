import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required payment verification parameters' }, { status: 400 });
    }

    // 1. Fetch booking record with relations
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

    // 2. Ownership verification
    if (booking.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized booking verification attempt' }, { status: 403 });
    }

    // 3. Fetch payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment order record not found' }, { status: 404 });
    }

    if (payment.userId !== user.id || payment.bookingId !== bookingId) {
      return NextResponse.json({ error: 'Payment record mismatch for this booking' }, { status: 400 });
    }

    // 4. Idempotency Check: if already processed, return clean response without re-mutating
    if (payment.status === 'SUCCESS' && (booking.status === 'CONFIRMED' || booking.status === 'PAID')) {
      return NextResponse.json({
        success: true,
        message: 'Booking already confirmed',
        bookingId: booking.id,
        amount: booking.totalAmount,
      });
    }

    // 5. Verify Razorpay Signature
    const isSignatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isSignatureValid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', errorReason: 'Signature verification failed' },
      });
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // 6. Transactional State Change
    await prisma.$transaction(async (tx) => {
      // Confirm Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Mark Payment Success
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS',
          errorReason: null,
        },
      });

      // Mark availability slot booked
      await tx.availabilitySlot.updateMany({
        where: {
          companionId: booking.companionId,
          date: booking.date,
          startTime: booking.startTime,
        },
        data: { isBooked: true },
      });

      // Update linked availability request status to BOOKED
      await tx.availabilityRequest.updateMany({
        where: {
          OR: [
            { bookingId: booking.id },
            {
              customerId: booking.customerId,
              companionId: booking.companionId,
              requestedDate: booking.date,
              status: 'ACCEPTED',
            },
          ],
        },
        data: {
          status: 'BOOKED',
          bookingId: booking.id,
        },
      });

      // Ensure single conversation exists for participant pair
      let conversation = await tx.conversation.findUnique({
        where: {
          customerId_companionUserId: {
            customerId: booking.customerId,
            companionUserId: booking.companion.userId,
          },
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            customerId: booking.customerId,
            companionUserId: booking.companion.userId,
          },
        });
      }

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    });

    // Send Notifications
    await createNotification(
      user.id,
      'Booking Confirmed!',
      `Your booking #${booking.bookingNumber} with ${booking.companion.displayName} for ${booking.activity.name} on ${booking.date} at ${booking.startTime} is confirmed.`,
      'BOOKING',
      '/profile?tab=bookings'
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
      amount: booking.totalAmount,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Booking verification processing failed' }, { status: 500 });
  }
}

