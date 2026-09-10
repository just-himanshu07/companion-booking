import { NextResponse } from 'next/server';
import { requireActiveAccount } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateOffPlatformContent } from '@/lib/offPlatformFilter';

export async function POST(req: Request) {
  try {
    const customer = await requireActiveAccount();
    const body = await req.json();


    const {
      companionId,
      requestedDate,
      requestedStartTime,
      requestedDuration,
      experienceType,
      generalArea,
      customerMessage,
    } = body;

    if (!companionId || !requestedDate || !requestedStartTime || !requestedDuration || !experienceType) {
      return NextResponse.json({ error: 'Missing required availability request fields.' }, { status: 400 });
    }

    // 1. Off-platform contact moderation check
    const filterCheck = validateOffPlatformContent(customerMessage);
    if (!filterCheck.isValid) {
      return NextResponse.json({ error: filterCheck.errorMessage }, { status: 400 });
    }

    // 2. Fetch target companion profile
    const companion = await prisma.companionProfile.findUnique({
      where: { id: companionId },
      select: { id: true, userId: true, displayName: true },
    });

    if (!companion) {
      return NextResponse.json({ error: 'Companion profile not found.' }, { status: 404 });
    }

    // 3. Expiration: Configurable 48-hour expiration window
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 4. Create AvailabilityRequest in database
    const availabilityRequest = await prisma.availabilityRequest.create({
      data: {
        customerId: customer.id,
        companionId: companion.id,
        requestedDate,
        requestedStartTime,
        requestedDuration: Number(requestedDuration),
        experienceType,
        generalArea: generalArea || null,
        customerMessage: customerMessage || null,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        companion: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profilePhoto: true,
          },
        },
      },
    });

    // 5. Send notification to Companion
    await prisma.notification.create({
      data: {
        userId: companion.userId,
        title: 'New Availability Request',
        message: `A client requested availability for ${experienceType} on ${requestedDate} at ${requestedStartTime} (${requestedDuration} hrs).`,
        type: 'AVAILABILITY_REQUEST',
        link: '/companion-dashboard?tab=requests',
      },
    });

    return NextResponse.json({ success: true, availabilityRequest });
  } catch (error: any) {
    if (
      error.message === 'ACCOUNT_UNDER_REVIEW' ||
      error.message === 'IDENTITY_VERIFICATION_REQUIRED' ||
      error.message === 'KYC_REJECTED' ||
      error.message === 'ACCOUNT_NOT_ACTIVE'
    ) {
      return NextResponse.json(
        {
          error: 'ACCOUNT_VERIFICATION_REQUIRED',
          message: 'Your account is currently under verification. You will get access to candidates and platform features after your identity verification is approved.',
        },
        { status: 403 }
      );
    }
    if (error.message === 'PAYMENT_REQUIRED') {
      return NextResponse.json(
        { error: 'PAYMENT_REQUIRED', message: 'Complete the ₹399 registration payment to continue.' },
        { status: 403 }
      );
    }
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required as Customer.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


