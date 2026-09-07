import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_FEEDBACK_TYPES = [
  'General Feedback',
  'Problem / Bug',
  'Suggestion',
  'Feature Request',
  'Complaint',
  'Other',
];

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const body = await req.json().catch(() => ({}));
    const { type, rating, message } = body;

    // 1. Validate Feedback Type
    if (!type || typeof type !== 'string' || !VALID_FEEDBACK_TYPES.includes(type.trim())) {
      return NextResponse.json(
        { error: 'Please select a valid feedback category.' },
        { status: 400 }
      );
    }

    // 2. Validate Message Content
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Feedback message is required.' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 2000) {
      return NextResponse.json(
        { error: 'Feedback message cannot exceed 2000 characters.' },
        { status: 400 }
      );
    }

    // 3. Validate Rating (Optional 1-5)
    let parsedRating: number | null = null;
    if (rating !== undefined && rating !== null && rating !== '') {
      const numRating = Number(rating);
      if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        return NextResponse.json(
          { error: 'Rating must be an integer between 1 and 5.' },
          { status: 400 }
        );
      }
      parsedRating = numRating;
    }

    // 4. Rate Limiting / Anti-Spam Check: Max 5 submissions per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmissionsCount = await prisma.feedback.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentSubmissionsCount >= 10) {
      return NextResponse.json(
        { error: 'You have submitted multiple feedback entries recently. Please try again later.' },
        { status: 429 }
      );
    }

    // 5. Store Feedback associated strictly with authenticated user.id
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        type: type.trim(),
        rating: parsedRating,
        message: trimmedMessage,
        status: 'NEW',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! Your feedback has been received and will help us improve Paireva.',
      feedbackId: feedback.id,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to submit feedback.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to submit feedback. Please try again.' }, { status: 500 });
  }
}

