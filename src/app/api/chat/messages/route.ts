import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { verifyConversationAccess } from '@/lib/messagingAuth';
import { validateOffPlatformContent } from '@/lib/offPlatformFilter';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const since = searchParams.get('since');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Strict Authorization & Confirmed Booking Verification
    const access = await verifyConversationAccess(user.id, conversationId);
    if (!access.allowed || !access.conversation) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const conversation = access.conversation;

    const before = searchParams.get('before');

    // Incremental polling mode: Fetch only messages newer than the 'since' timestamp
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        const incrementalMessages = await prisma.message.findMany({
          where: {
            conversationId,
            createdAt: { gt: sinceDate },
          },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            text: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                customerProfile: { select: { name: true } },
                companionProfile: { select: { displayName: true } },
              },
            },
          },
        });

        if (incrementalMessages.length > 0) {
          // Mark unread incoming messages as read asynchronously
          await prisma.message.updateMany({
            where: {
              conversationId,
              senderId: { not: user.id },
              isRead: false,
            },
            data: { isRead: true },
          });
        }

        return NextResponse.json({
          incremental: true,
          messages: incrementalMessages,
          conversationId,
        });
      }
    }

    // Older message pagination mode: Fetch messages older than the 'before' timestamp cursor
    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        const rawOlderMessages = await prisma.message.findMany({
          where: {
            conversationId,
            createdAt: { lt: beforeDate },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            text: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                customerProfile: { select: { name: true } },
                companionProfile: { select: { displayName: true } },
              },
            },
          },
        });

        const olderMessages = rawOlderMessages.reverse();

        return NextResponse.json({
          pagination: true,
          messages: olderMessages,
          hasMore: rawOlderMessages.length === 50,
          conversationId,
        });
      }
    }

    // Initial load mode: Fetch latest 50 messages and timeline bookings concurrently
    const [rawMessages, bookings] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          text: true,
          isRead: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              email: true,
              role: true,
              customerProfile: { select: { name: true } },
              companionProfile: { select: { displayName: true } },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          customerId: conversation.customerId,
          companion: { userId: conversation.companionUserId },
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        select: {
          id: true,
          bookingNumber: true,
          date: true,
          startTime: true,
          durationHours: true,
          status: true,
          createdAt: true,
          activity: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const messages = rawMessages.reverse();

    // Asynchronously mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      incremental: false,
      messages,
      bookings,
      conversation,
      hasMore: rawMessages.length === 50,
    });
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
    const { conversationId, text } = await req.json();

    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and message content are required' }, { status: 400 });
    }

    // Strict Authorization & Confirmed Booking Verification
    const access = await verifyConversationAccess(user.id, conversationId);
    if (!access.allowed || !access.conversation) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const conversation = access.conversation;

    // Check if user is blocked
    const recipientId = conversation.customerId === user.id ? conversation.companionUserId : conversation.customerId;
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: recipientId },
          { blockerId: recipientId, blockedId: user.id },
        ],
      },
    });

    if (isBlocked) {
      return NextResponse.json({ error: 'Messaging is disabled due to a block constraint.' }, { status: 403 });
    }

    // Server-side Off-Platform Security Validation
    const validation = validateOffPlatformContent(text.trim());
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errorMessage }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        text: text.trim(),
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        text: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            customerProfile: { select: { name: true } },
            companionProfile: { select: { displayName: true } },
          },
        },
      },
    });

    // Execute lastMessageAt update and recipient notification concurrently
    await Promise.all([
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      createNotification(
        recipientId,
        'New Message Received',
        `You received a new message regarding your companion booking.`,
        'CHAT',
        `/messages?conversationId=${conversationId}`
      ),
    ]);

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
