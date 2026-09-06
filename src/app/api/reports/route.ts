import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { reportSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validatedData = reportSchema.parse(body);

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: validatedData.reportedUserId,
        reason: validatedData.reason,
        description: validatedData.description,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our safety compliance team will review it immediately.',
      reportId: report.id,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

