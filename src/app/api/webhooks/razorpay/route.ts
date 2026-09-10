import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const paymentRecord = await prisma.payment.findUnique({
          where: { razorpayOrderId },
        });

        if (paymentRecord && paymentRecord.status !== 'SUCCESS') {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: paymentRecord.id },
              data: {
                status: 'SUCCESS',
                razorpayPaymentId: razorpayPaymentId || paymentRecord.razorpayPaymentId,
              },
            });

            if (paymentRecord.paymentType === 'REGISTRATION_FEE') {
              const user = await tx.user.findUnique({
                where: { id: paymentRecord.userId },
              });

              if (user) {
                const nextStatus = user.isEmailVerified ? 'ACTIVE' : 'PENDING';
                await tx.user.update({
                  where: { id: user.id },
                  data: {
                    isRegistrationFeePaid: true,
                    accountStatus: nextStatus,
                  },
                });
              }
            } else if (paymentRecord.paymentType === 'BOOKING_PAYMENT' && paymentRecord.bookingId) {
              await tx.booking.update({
                where: { id: paymentRecord.bookingId },
                data: {
                  status: 'PAID',
                },
              });
            }
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

