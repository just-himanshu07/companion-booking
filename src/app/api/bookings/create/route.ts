import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { bookingSchema } from '@/lib/validators';
import { createRazorpayOrder, getPlatformSettings } from '@/lib/razorpay';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Check if customer registration fee paid
    if (!user.isRegistrationFeePaid) {
      return NextResponse.json(
        { error: 'Please complete your ₹399 registration fee payment before booking a companion.' },
        { status: 403 }
      );
    }

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
          activityId: validatedData.activityId,
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

