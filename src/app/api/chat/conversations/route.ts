import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyConfirmedBookingBetweenUsers } from '@/lib/messagingAuth';

export async function GET() {
  try {
    const user = await requireAuth();

    const rawConversations = await prisma.conversation.findMany({
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

    // Filter conversations so ONLY those with a CONFIRMED booking are returned
    const confirmedConversations = [];
    for (const conv of rawConversations) {
      if (conv.booking && ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(conv.booking.status)) {
        confirmedConversations.push(conv);
      } else {
        const { isConfirmed } = await verifyConfirmedBookingBetweenUsers(
          conv.customerId,
          conv.companionUserId,
          conv.bookingId || undefined
        );
        if (isConfirmed) {
          confirmedConversations.push(conv);
        }
      }
    }

    return NextResponse.json({ conversations: confirmedConversations });
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

    // Strict Authorization Verification: Require CONFIRMED booking
    const { isConfirmed } = await verifyConfirmedBookingBetweenUsers(customerId, compId, bookingId);

    if (!isConfirmed) {
      return NextResponse.json(
        { error: 'Messaging is available only after your booking is confirmed.' },
        { status: 403 }
      );
    }

    // Find or create conversation
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
