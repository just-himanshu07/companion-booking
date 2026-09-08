import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { Role, AccountStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role')?.trim();
    const accountStatus = searchParams.get('accountStatus')?.trim();
    const isEmailVerified = searchParams.get('isEmailVerified');
    const isRegistrationFeePaid = searchParams.get('isRegistrationFeePaid');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { customerProfile: { name: { contains: search, mode: 'insensitive' } } },
        { companionProfile: { displayName: { contains: search, mode: 'insensitive' } } },
        { companionProfile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (role && ['CUSTOMER', 'COMPANION', 'ADMIN'].includes(role)) {
      where.role = role as Role;
    }

    if (accountStatus && ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED'].includes(accountStatus)) {
      where.accountStatus = accountStatus as AccountStatus;
    }

    if (isEmailVerified !== null && isEmailVerified !== undefined && isEmailVerified !== '') {
      where.isEmailVerified = isEmailVerified === 'true';
    }

    if (isRegistrationFeePaid !== null && isRegistrationFeePaid !== undefined && isRegistrationFeePaid !== '') {
      where.isRegistrationFeePaid = isRegistrationFeePaid === 'true';
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          accountStatus: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isRegistrationFeePaid: true,
          emailVerificationAttempts: true,
          emailVerificationLastSentAt: true,
          emailVerificationOtpExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          customerProfile: {
            select: {
              id: true,
              name: true,
              gender: true,
              city: true,
              age: true,
              displayAvatar: true,
              gallery: true,
            },
          },
          companionProfile: {
            select: {
              id: true,
              username: true,
              displayName: true,
              fullName: true,
              profilePhoto: true,
              gallery: true,
              verificationStatus: true,
              hourlyPrice: true,
              averageRating: true,
              totalReviews: true,
              city: { select: { name: true } },
            },
          },
          _count: {
            select: {
              payments: true,
              bookingsAsCustomer: true,
              feedbacks: true,
              notifications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const body = await req.json();
    const { userId, action, role, reason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Do not allow self-demotion or banning super admin
    if (targetUser.id === admin.id && (action === 'BAN' || action === 'SUSPEND')) {
      return NextResponse.json({ error: 'Cannot modify your own administrative account status' }, { status: 400 });
    }

    let updateData: any = {};

    switch (action) {
      case 'SUSPEND':
        updateData.accountStatus = 'SUSPENDED';
        break;
      case 'UNSUSPEND':
      case 'UNBAN':
      case 'RESTORE':
        updateData.accountStatus = targetUser.isEmailVerified ? 'ACTIVE' : 'PENDING';
        break;
      case 'BAN':
        updateData.accountStatus = 'BANNED';
        break;
      case 'UPDATE_ROLE':
        if (!role || !['CUSTOMER', 'COMPANION', 'ADMIN'].includes(role)) {
          return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
        }
        updateData.role = role as Role;
        break;
      case 'MARK_EMAIL_VERIFIED':
        updateData.isEmailVerified = true;
        if (targetUser.accountStatus === 'PENDING' && targetUser.isRegistrationFeePaid) {
          updateData.accountStatus = 'ACTIVE';
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        isEmailVerified: true,
        isRegistrationFeePaid: true,
      },
    });

    await logAdminAction(admin.id, `USER_${action}`, 'USER', userId, {
      previousStatus: targetUser.accountStatus,
      newStatus: updatedUser.accountStatus,
      role,
      reason,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            bookingsAsCustomer: true,
            payments: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    // Safety check: Prevent deleting users with active financial / booking history
    if (targetUser._count.bookingsAsCustomer > 0 || targetUser._count.payments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing financial transaction or booking records. Suspend or Ban the account instead.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    await logAdminAction(admin.id, 'DELETE_USER', 'USER', userId, {
      deletedEmail: targetUser.email,
    });

    return NextResponse.json({ success: true, message: 'User account deleted successfully' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

