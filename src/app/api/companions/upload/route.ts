import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { companionId, documentType, fileUrl } = await req.json();

    if (!companionId || !documentType || !fileUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const doc = await prisma.verificationDocument.create({
      data: {
        companionId,
        documentType,
        fileUrl,
        status: 'PENDING',
      },
    });

    // Update companion verification status to UNDER_REVIEW
    await prisma.companionProfile.update({
      where: { id: companionId },
      data: { verificationStatus: 'UNDER_REVIEW' },
    });

    return NextResponse.json({ success: true, doc });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

