import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { registrationFee, commissionPercent } = await req.json();

    if (registrationFee !== undefined) {
      await prisma.platformSetting.upsert({
        where: { key: 'REGISTRATION_FEE_INR' },
        update: { value: registrationFee.toString() },
        create: {
          key: 'REGISTRATION_FEE_INR',
          value: registrationFee.toString(),
          description: 'One-time customer registration fee in INR',
        },
      });
    }

    if (commissionPercent !== undefined) {
      await prisma.platformSetting.upsert({
        where: { key: 'PLATFORM_COMMISSION_PERCENT' },
        update: { value: commissionPercent.toString() },
        create: {
          key: 'PLATFORM_COMMISSION_PERCENT',
          value: commissionPercent.toString(),
          description: 'Default platform commission percentage on bookings',
        },
      });
    }

    await logAdminAction(admin.id, 'UPDATE_PLATFORM_SETTINGS', 'PLATFORM_SETTING', undefined, {
      registrationFee,
      commissionPercent,
    });

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

