import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { readSecureKYCFile } from '@/lib/kycStorage';

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const user = await requireAuth();
    const fileName = params.filename;

    if (!fileName) {
      return NextResponse.json({ error: 'File name parameter required' }, { status: 400 });
    }

    // Admin can view any KYC document
    let isAuthorized = user.role === 'ADMIN';

    // Non-admin can only view their own submitted document
    if (!isAuthorized) {
      const verification = await prisma.identityVerification.findUnique({
        where: { userId: user.id },
        select: {
          documentFrontUrl: true,
          documentBackUrl: true,
          selfieUrl: true,
        },
      });

      if (verification) {
        const fileUrl = `/api/verification/document/${fileName}`;
        if (
          verification.documentFrontUrl === fileUrl ||
          verification.documentBackUrl === fileUrl ||
          verification.selfieUrl === fileUrl
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to access this identity document.' },
        { status: 403 }
      );
    }

    const fileData = await readSecureKYCFile(fileName);
    if (!fileData) {
      return NextResponse.json({ error: 'Requested document not found' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(fileData.buffer), {
      status: 200,
      headers: {
        'Content-Type': fileData.mimeType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

