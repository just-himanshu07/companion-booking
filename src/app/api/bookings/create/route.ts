import { NextResponse } from 'next/server';
import { requireActiveAccount } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { bookingSchema } from '@/lib/validators';
import { createRazorpayOrder, getPlatformSettings } from '@/lib/razorpay';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireActiveAccount();


    const body = await req.json();
    const validatedData = bookingSchema.parse(body);

    const companion = await prisma.companionProfile.findUnique({
      where: { id: validatedData.companionId },
      include: { user: true },
    });

    if (!companion || companion.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Selected companion is currently unavailable or unverified.' },
        { status: 400 }
      );
    }

    // Verify & resolve valid activityId in current database
    let resolvedActivityId = validatedData.activityId;
    let activityRecord = null;

    if (resolvedActivityId && resolvedActivityId !== '00000000-0000-0000-0000-000000000000') {
      activityRecord = await prisma.activity.findUnique({
        where: { id: resolvedActivityId },
      });
    }

    if (!activityRecord && validatedData.availabilityRequestId) {
      const request = await prisma.availabilityRequest.findUnique({
        where: { id: validatedData.availabilityRequestId },
        select: { experienceType: true },
      });

      if (request?.experienceType) {
        const expLower = request.experienceType.trim().toLowerCase();
        activityRecord = await prisma.activity.findFirst({
          where: {
            OR: [
              { name: { equals: request.experienceType, mode: 'insensitive' } },
              { slug: { equals: expLower } },
              { name: { contains: request.experienceType, mode: 'insensitive' } },
            ],
          },
        });
      }
    }

    if (!activityRecord) {
      const companionActivity = await prisma.companionActivity.findFirst({
        where: { companionId: companion.id },
        select: { activityId: true, activity: true },
      });
      if (companionActivity?.activity) {
        activityRecord = companionActivity.activity;
      }
    }

    if (!activityRecord) {
      activityRecord = await prisma.activity.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!activityRecord) {
      return NextResponse.json(
        { error: 'No valid social activity found in the system. Please select a valid activity.' },
        { status: 400 }
      );
    }

    resolvedActivityId = activityRecord.id;

    // Atomic double booking check inside Prisma transaction
    const bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Check slot availability
      const slot = await tx.availabilitySlot.findFirst({
        where: {
          companionId: companion.id,
          date: validatedData.date,
          startTime: validatedData.startTime,
        },
      });

      if (slot && slot.isBooked) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 2. Check existing active booking on same slot
      const existingBooking = await tx.booking.findFirst({
        where: {
          companionId: companion.id,
          date: validatedData.date,
          startTime: validatedData.startTime,
          status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'PAYMENT_PENDING'] },
        },
      });

      if (existingBooking) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 3. Platform commission snapshot
      const { commissionPercent } = await getPlatformSettings();
      const duration = validatedData.durationHours;
      const hourlyPrice = companion.hourlyPrice;
      const totalAmount = hourlyPrice * duration;
      const commissionAmount = (totalAmount * commissionPercent) / 100;
      const companionEarnings = totalAmount - commissionAmount;

      const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: user.id,
          companionId: companion.id,
          activityId: resolvedActivityId,
          date: validatedData.date,
          startTime: validatedData.startTime,
          endTime: `${parseInt(validatedData.startTime.split(':')[0], 10) + duration}:00`,
          durationHours: duration,
          hourlyPriceSnapshot: hourlyPrice,
          totalAmount,
          commissionRateSnapshot: commissionPercent,
          commissionAmount,
          companionEarnings,
          status: 'PAYMENT_PENDING',
          notes: validatedData.notes,
        },
      });

      if (validatedData.availabilityRequestId) {
        await tx.availabilityRequest.updateMany({
          where: {
            id: validatedData.availabilityRequestId,
            customerId: user.id,
            companionId: companion.id,
            status: 'ACCEPTED',
          },
          data: {
            bookingId: booking.id,
          },
        });
      }

      return booking;
    });

    // Create Razorpay Order for booking amount
    const order = await createRazorpayOrder(bookingResult.totalAmount, bookingResult.bookingNumber, {
      bookingId: bookingResult.id,
      bookingNumber: bookingResult.bookingNumber,
      paymentType: 'BOOKING_PAYMENT',
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
        userId: user.id,
        bookingId: bookingResult.id,
        paymentType: 'BOOKING_PAYMENT',
        amount: bookingResult.totalAmount,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      booking: bookingResult,
      razorpayOrder: {
        id: order.id,
        amount: bookingResult.totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_companion12345',
      },
    });
  } catch (error: any) {
    if (
      error.message === 'ACCOUNT_UNDER_REVIEW' ||
      error.message === 'IDENTITY_VERIFICATION_REQUIRED' ||
      error.message === 'KYC_REJECTED' ||
      error.message === 'ACCOUNT_NOT_ACTIVE'
    ) {
      return NextResponse.json(
        {
          error: 'ACCOUNT_VERIFICATION_REQUIRED',
          message: 'Your account is currently under verification. You will get access to candidates and platform features after your identity verification is approved.',
        },
        { status: 403 }
      );
    }
    if (error.message === 'PAYMENT_REQUIRED') {
      return NextResponse.json(
        { error: 'PAYMENT_REQUIRED', message: 'Please complete your ₹399 registration fee payment before booking a companion.' },
        { status: 403 }
      );
    }
    if (error.message === 'SLOT_ALREADY_BOOKED') {
      return NextResponse.json(
        { error: 'This time slot has just been booked by another customer. Please select another time.' },
        { status: 409 }
      );
    }
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to book a companion' }, { status: 401 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 500 });
  }
}

