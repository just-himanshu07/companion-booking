import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAdminStats } from '@/lib/adminStats';
import { getPlatformSettings } from '@/lib/razorpay';

export async function GET() {
  const startTime = Date.now();
  try {
    await requireRole(['ADMIN']);

    const [stats, settings] = await Promise.all([
      getAdminStats(),
      getPlatformSettings(),
    ]);

    const duration = Date.now() - startTime;
    return NextResponse.json(
      { stats, settings, queryDurationMs: duration },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
