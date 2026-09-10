import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRazorpayOrder, getPlatformSettings } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionUser = await getSessionUser();
    let targetUserId = sessionUser?.id || body.userId;
    let targetUser = null;

    if (targetUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (body.email) {
      targetUser = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User account not found. Please register first.' }, { status: 404 });
    }

    if (targetUser.isRegistrationFeePaid) {
      return NextResponse.json(
        { error: 'Registration fee has already been paid for this account.' },
        { status: 400 }
      );
    }

    const { registrationFee } = await getPlatformSettings();
    const receipt = `reg_${targetUser.id}_${Date.now()}`;

    const order = await createRazorpayOrder(registrationFee, receipt, {
      userId: targetUser.id,
      paymentType: 'REGISTRATION_FEE',
    });

    // Save pending payment record
    await prisma.payment.upsert({
      where: { razorpayOrderId: order.id },
      update: {
        amount: registrationFee,
        status: 'PENDING',
        userId: targetUser.id,
      },
      create: {
        paymentNumber: `REG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: targetUser.id,
        paymentType: 'REGISTRATION_FEE',
        amount: registrationFee,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'PENDING',
      },
    });


    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: registrationFee,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_companion12345',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to proceed' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create payment order' }, { status: 500 });
  }
}

