import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// Helper to mask sensitive contact details (phone numbers, emails, external links)
function maskSensitiveContactInfo(text: string): string {
  // Mask emails
  let sanitized = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[contact info hidden for safety]');
  // Mask 10-digit phone numbers or numbers with spaces/dashes
  sanitized = sanitized.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[phone number hidden for safety]');
  return sanitized;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.customerId !== user.id && conversation.companionUserId !== user.id)) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 403 });
    }

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

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.customerId !== user.id && conversation.companionUserId !== user.id)) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 403 });
    }

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

    const sanitizedText = maskSensitiveContactInfo(text.trim());

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        text: sanitizedText,
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

