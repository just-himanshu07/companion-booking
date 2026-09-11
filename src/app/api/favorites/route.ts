import { NextResponse } from 'next/server';
import { requireActiveAccount } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireActiveAccount();

    const favorites = await prisma.favorite.findMany({
      where: { customerId: user.id },
      include: {
        companion: {
          include: {
            city: true,
            activities: { include: { activity: true } },
          },
        },
      },
    });

    return NextResponse.json({ favorites });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (
      error.message === 'ACCOUNT_UNDER_REVIEW' ||
      error.message === 'IDENTITY_VERIFICATION_REQUIRED' ||
      error.message === 'KYC_REJECTED' ||
      error.message === 'ACCOUNT_NOT_ACTIVE' ||
      error.message === 'PAYMENT_REQUIRED'
    ) {
      return NextResponse.json(
        { error: 'ACCOUNT_NOT_ACTIVE', message: 'You will access saved favorites after your account verification is approved.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireActiveAccount();

    const { companionId } = await req.json();

    if (!companionId) {
      return NextResponse.json({ error: 'Companion ID required' }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        customerId_companionId: {
          customerId: user.id,
          companionId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: {
          customerId: user.id,
          companionId,
        },
      });
      return NextResponse.json({ success: true, isFavorite: true });
    }
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (
      error.message === 'ACCOUNT_UNDER_REVIEW' ||
      error.message === 'IDENTITY_VERIFICATION_REQUIRED' ||
      error.message === 'KYC_REJECTED' ||
      error.message === 'ACCOUNT_NOT_ACTIVE' ||
      error.message === 'PAYMENT_REQUIRED'
    ) {
      return NextResponse.json(
        { error: 'ACCOUNT_NOT_ACTIVE', message: 'You will access saved favorites after your account verification is approved.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
