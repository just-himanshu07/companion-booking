import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateOffPlatformContent } from '@/lib/offPlatformFilter';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireRole(['CUSTOMER', 'COMPANION']);
    if (currentUser.role === 'CUSTOMER') {
      if (currentUser.accountStatus === 'UNDER_REVIEW') {
        return NextResponse.json(
          { error: 'ACCOUNT_UNDER_REVIEW', message: 'Your account is under identity verification review.' },
          { status: 403 }
        );
      }
      if (currentUser.accountStatus !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'IDENTITY_VERIFICATION_REQUIRED', message: 'Please complete identity verification to continue.' },
          { status: 403 }
        );
      }
    }
    const requestId = params.id;

    const body = await req.json();

    const {
      action,
      counterDate,
      counterStartTime,
      counterDuration,
      companionMessage,
    } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required.' }, { status: 400 });
    }

    const request = await prisma.availabilityRequest.findUnique({
      where: { id: requestId },
      include: {
        companion: { select: { id: true, userId: true, displayName: true } },
        customer: { select: { id: true, email: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Availability request not found.' }, { status: 404 });
    }

    // Check if expired
    if (request.status === 'PENDING' && new Date() > new Date(request.expiresAt)) {
      await prisma.availabilityRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'This availability request has expired.' }, { status: 400 });
    }

    let updateData: any = {};
    let notificationRecipientId = '';
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationLink = '';

    switch (action) {
      case 'ACCEPT': {
        // Only the target companion can accept
        if (request.companion.userId !== currentUser.id) {
          return NextResponse.json({ error: 'Unauthorized to respond to this request.' }, { status: 403 });
        }
        updateData.status = 'ACCEPTED';
        notificationRecipientId = request.customerId;
        notificationTitle = 'Availability Confirmed ✓';
        notificationMessage = `${request.companion.displayName} confirmed availability for ${request.experienceType} on ${request.requestedDate} at ${request.requestedStartTime}. You can now complete your booking.`;
        notificationLink = '/profile?tab=requests';
        break;
      }

      case 'DECLINE': {
        // Only the target companion can decline
        if (request.companion.userId !== currentUser.id) {
          return NextResponse.json({ error: 'Unauthorized to respond to this request.' }, { status: 403 });
        }
        updateData.status = 'DECLINED';
        notificationRecipientId = request.customerId;
        notificationTitle = 'Availability Update';
        notificationMessage = `Unfortunately, ${request.companion.displayName} isn't available for your requested time on ${request.requestedDate}.`;
        notificationLink = '/profile?tab=requests';
        break;
      }

      case 'COUNTER_PROPOSE': {
        // Only the target companion can counter propose
        if (request.companion.userId !== currentUser.id) {
          return NextResponse.json({ error: 'Unauthorized to respond to this request.' }, { status: 403 });
        }
        if (!counterDate || !counterStartTime || !counterDuration) {
          return NextResponse.json({ error: 'Counter date, start time, and duration are required.' }, { status: 400 });
        }

        const filterCheck = validateOffPlatformContent(companionMessage);
        if (!filterCheck.isValid) {
          return NextResponse.json({ error: filterCheck.errorMessage }, { status: 400 });
        }

        updateData = {
          status: 'COUNTER_PROPOSED',
          counterDate,
          counterStartTime,
          counterDuration: Number(counterDuration),
          companionMessage: companionMessage || null,
        };

        notificationRecipientId = request.customerId;
        notificationTitle = 'Alternative Time Suggested';
        notificationMessage = `${request.companion.displayName} suggested an alternative time: ${counterDate} at ${counterStartTime} (${counterDuration} hrs).`;
        notificationLink = '/profile?tab=requests';
        break;
      }

      case 'ACCEPT_COUNTER': {
        // Only the customer who created the request can accept a counter proposal
        if (request.customerId !== currentUser.id) {
          return NextResponse.json({ error: 'Unauthorized to accept counter proposal.' }, { status: 403 });
        }
        if (request.status !== 'COUNTER_PROPOSED') {
          return NextResponse.json({ error: 'No counter proposal pending for this request.' }, { status: 400 });
        }

        updateData = {
          status: 'ACCEPTED',
          requestedDate: request.counterDate || request.requestedDate,
          requestedStartTime: request.counterStartTime || request.requestedStartTime,
          requestedDuration: request.counterDuration || request.requestedDuration,
        };

        notificationRecipientId = request.companion.userId;
        notificationTitle = 'Counter Proposal Accepted ✓';
        notificationMessage = `The client accepted your alternative time slot (${request.counterDate} at ${request.counterStartTime}).`;
        notificationLink = '/companion-dashboard?tab=requests';
        break;
      }

      case 'CANCEL': {
        if (request.customerId !== currentUser.id) {
          return NextResponse.json({ error: 'Unauthorized to cancel this request.' }, { status: 403 });
        }
        updateData.status = 'CANCELLED';
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 });
    }

    const updatedRequest = await prisma.availabilityRequest.update({
      where: { id: requestId },
      data: updateData,
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

    if (notificationRecipientId && notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: notificationRecipientId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'AVAILABILITY_RESPONSE',
          link: notificationLink,
        },
      });
    }

    return NextResponse.json({ success: true, availabilityRequest: updatedRequest });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

