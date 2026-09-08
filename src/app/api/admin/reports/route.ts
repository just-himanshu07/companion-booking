import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { ReportStatus } from '@prisma/client';

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reporter: { email: { contains: search, mode: 'insensitive' } } },
        { reportedUser: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        select: {
          id: true,
          reason: true,
          description: true,
          status: true,
          createdAt: true,
          reporter: {
            select: {
              id: true,
              email: true,
              role: true,
              customerProfile: { select: { name: true } },
              companionProfile: { select: { displayName: true } },
            },
          },
          reportedUser: {
            select: {
              id: true,
              email: true,
              role: true,
              accountStatus: true,
              customerProfile: { select: { name: true } },
              companionProfile: { select: { displayName: true, username: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        reports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        queryDurationMs: duration,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
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
    const { reportId, status, adminNotes } = await req.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Report ID and status are required' }, { status: 400 });
    }

    if (!Object.values(ReportStatus).includes(status as ReportStatus)) {
      return NextResponse.json({ error: 'Invalid report status' }, { status: 400 });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as ReportStatus,
      },
    });

    await logAdminAction(admin.id, `UPDATE_REPORT_STATUS_${status}`, 'REPORT', reportId, {
      status,
      adminNotes,
    });

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

