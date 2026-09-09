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

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Strict Authorization & Confirmed Booking Verification
    const access = await verifyConversationAccess(user.id, conversationId);
    if (!access.allowed || !access.conversation) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const conversation = access.conversation;

    // Fetch messages for this unified conversation thread
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
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

    // Fetch all bookings between this customer and companion to render as timeline events
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: conversation.customerId,
        companion: { userId: conversation.companionUserId },
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
      },
      include: {
        activity: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      messages,
      bookings,
      conversation,
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
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notify recipient
    await createNotification(
      recipientId,
      'New Message Received',
      `You received a new message regarding your companion booking.`,
      'CHAT',
      `/messages?conversationId=${conversationId}`
    );

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
