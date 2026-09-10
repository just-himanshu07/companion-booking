import { NextResponse } from 'next/server';
import { requireActiveAccount } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyConfirmedBookingBetweenUsers } from '@/lib/messagingAuth';

export async function GET() {
  try {
    const user = await requireActiveAccount();


    const rawConversations = await prisma.conversation.findMany({
      where: {
        OR: [{ customerId: user.id }, { companionUserId: user.id }],
      },
      select: {
        id: true,
        customerId: true,
        companionUserId: true,
        lastMessageAt: true,
        createdAt: true,
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, text: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    let confirmedConversations: any[] = [];

    if (rawConversations.length > 0) {
      const pairFilters = rawConversations.map((c) => ({
        customerId: c.customerId,
        companion: { userId: c.companionUserId },
      }));

      const confirmedBookings = await prisma.booking.findMany({
        where: {
          OR: pairFilters,
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        select: {
          id: true,
          customerId: true,
          companion: { select: { userId: true } },
          activity: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const bookingMap = new Map<string, any>();
      for (const b of confirmedBookings) {
        const key = `${b.customerId}:${b.companion.userId}`;
        if (!bookingMap.has(key)) {
          bookingMap.set(key, b);
        }
      }

      confirmedConversations = rawConversations
        .filter((c) => bookingMap.has(`${c.customerId}:${c.companionUserId}`))
        .map((c) => ({
          ...c,
          booking: bookingMap.get(`${c.customerId}:${c.companionUserId}`),
        }));
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
    const user = await requireActiveAccount();

    const { companionUserId, companionProfileId } = await req.json();

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
    const { isConfirmed } = await verifyConfirmedBookingBetweenUsers(customerId, compId);

    if (!isConfirmed) {
      return NextResponse.json(
        { error: 'Messaging is available only after your booking is confirmed.' },
        { status: 403 }
      );
    }

    // Find or create single conversation for participant pair
    let conversation = await prisma.conversation.findUnique({
      where: {
        customerId_companionUserId: {
          customerId,
          companionUserId: compId,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          customerId,
          companionUserId: compId,
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
