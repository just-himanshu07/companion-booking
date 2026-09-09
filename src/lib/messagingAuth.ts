import { prisma } from './db';

const CONFIRMED_BOOKING_STATUSES = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

/**
 * Checks if a confirmed booking exists between a customer and a companion user.
 */
export async function verifyConfirmedBookingBetweenUsers(
  customerId: string,
  companionUserId: string,
  bookingId?: string
) {
  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: { select: { userId: true } },
      },
    });

    if (
      booking &&
      booking.customerId === customerId &&
      booking.companion.userId === companionUserId &&
      CONFIRMED_BOOKING_STATUSES.includes(booking.status)
    ) {
      return { isConfirmed: true, booking };
    }

    return { isConfirmed: false, booking: null };
  }

  const booking = await prisma.booking.findFirst({
    where: {
      customerId,
      companion: { userId: companionUserId },
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { isConfirmed: !!booking, booking };
}

/**
 * Verifies if an authenticated user (userId) has access to a specific conversation ID.
 * Access requires:
 * 1. User is customerId or companionUserId in the conversation.
 * 2. There is a CONFIRMED booking between customerId and companionUserId.
 */
export async function verifyConversationAccess(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: { select: { id: true } },
      companionUser: { select: { id: true } },
    },
  });

  if (!conversation) {
    return { allowed: false, status: 404, error: 'Conversation not found', conversation: null };
  }

  // 1. Ensure user is either customer or companion in this conversation
  if (conversation.customerId !== userId && conversation.companionUserId !== userId) {
    return { allowed: false, status: 403, error: 'Access denied to this conversation', conversation: null };
  }

  // 2. Check if any confirmed booking exists between conversation participants
  const { isConfirmed, booking } = await verifyConfirmedBookingBetweenUsers(
    conversation.customerId,
    conversation.companionUserId
  );

  if (!isConfirmed) {
    return {
      allowed: false,
      status: 403,
      error: 'Messaging is available only after your booking is confirmed.',
      conversation: null,
    };
  }

  return { allowed: true, status: 200, conversation, activeBooking: booking };
}
