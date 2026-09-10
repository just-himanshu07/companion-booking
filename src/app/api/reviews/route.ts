import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { reviewSchema } from '@/lib/validators';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    if (user.role === 'CUSTOMER' && !user.isRegistrationFeePaid) {
      return NextResponse.json(
        { error: 'PAYMENT_REQUIRED', message: 'Complete the ₹399 registration payment to continue.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { companion: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Reviews can only be submitted after a booking has been marked COMPLETED.' },
        { status: 400 }
      );
    }

    // Verify user was customer or companion in this booking
    const isCustomer = booking.customerId === user.id;
    const isCompanion = booking.companion.userId === user.id;

    if (!isCustomer && !isCompanion) {
      return NextResponse.json({ error: 'You are not authorized to review this booking' }, { status: 403 });
    }

    // Prevent duplicate review
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: booking.id },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already submitted a review for this booking' }, { status: 400 });
    }

    const revieweeId = isCustomer ? booking.companion.userId : booking.customerId;

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          bookingId: booking.id,
          reviewerId: user.id,
          revieweeId,
          rating: validatedData.rating,
          comment: validatedData.comment,
          isCustomerReviewingCompanion: isCustomer,
        },
      });

      // Recalculate average rating if reviewing companion
      if (isCustomer) {
        const companionReviews = await tx.review.findMany({
          where: {
            revieweeId: booking.companion.userId,
            isCustomerReviewingCompanion: true,
          },
          select: { rating: true },
        });

        const totalReviews = companionReviews.length;
        const avgRating = companionReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

        await tx.companionProfile.update({
          where: { id: booking.companionId },
          data: {
            averageRating: parseFloat(avgRating.toFixed(2)),
            totalReviews,
          },
        });
      }

      return createdReview;
    });

    await createNotification(
      revieweeId,
      'New Review Received',
      `You received a ${validatedData.rating}-star review for booking #${booking.bookingNumber}.`,
      'REVIEW',
      '/profile'
    );

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}

