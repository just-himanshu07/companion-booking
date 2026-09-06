import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ customerId: user.id }, { companionUserId: user.id }],
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            customerProfile: { select: { name: true, displayAvatar: true } },
          },
        },
        companionUser: {
          select: {
            id: true,
            email: true,
            companionProfile: { select: { displayName: true, profilePhoto: true } },
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            date: true,
            startTime: true,
            status: true,
            activity: { select: { name: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { companionUserId, companionProfileId, bookingId } = await req.json();

    let targetCompanionUserId = companionUserId;

    if (!targetCompanionUserId && companionProfileId) {
      const profile = await prisma.companionProfile.findUnique({
        where: { id: companionProfileId },
        select: { userId: true },
      });
      if (profile) targetCompanionUserId = profile.userId;
    }

    if (!targetCompanionUserId) {
      return NextResponse.json({ error: 'Target companion user ID is required' }, { status: 400 });
    }

    const customerId = user.role === 'CUSTOMER' ? user.id : targetCompanionUserId;
    const compId = user.role === 'CUSTOMER' ? targetCompanionUserId : user.id;

    // Check existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId,
        companionUserId: compId,
        ...(bookingId ? { bookingId } : {}),
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          customerId,
          companionUserId: compId,
          bookingId: bookingId || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
