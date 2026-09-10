import { NextResponse } from 'next/server';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { readSecureKYCFile } from '@/lib/kycStorage';

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const user = await requireAuth();
    const rawFileName = params.filename || '';
    const cleanFileName = path.basename(decodeURIComponent(rawFileName)).split('?')[0];

    if (!cleanFileName) {
      return NextResponse.json({ error: 'File name parameter required' }, { status: 400 });
    }

    // Admin can view any KYC document
    let isAuthorized = user.role === 'ADMIN';

    // Non-admin can only view their own submitted document
    if (!isAuthorized) {
      const verification = await prisma.identityVerification.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          documentFrontUrl: true,
          documentBackUrl: true,
          selfieUrl: true,
        },
      });

      if (verification) {
        if (
          verification.id === cleanFileName ||
          verification.documentFrontUrl?.includes(cleanFileName) ||
          verification.documentBackUrl?.includes(cleanFileName) ||
          verification.selfieUrl?.includes(cleanFileName)
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

    // Strategy 1: Direct lookup by filename or ID
    let fileData = await readSecureKYCFile(cleanFileName);

    // Strategy 2: If passed an IdentityVerification record ID or user ID directly
    if (!fileData) {
      const verificationRecord = await prisma.identityVerification.findFirst({
        where: {
          OR: [
            { id: cleanFileName },
            { userId: cleanFileName },
          ],
        },
        select: {
          documentFrontUrl: true,
        },
      });

      if (verificationRecord && verificationRecord.documentFrontUrl) {
        const frontName = path.basename(verificationRecord.documentFrontUrl);
        fileData = await readSecureKYCFile(frontName);
      }
    }

    if (!fileData) {
      return NextResponse.json({ error: 'Requested document not found' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(fileData.buffer), {
      status: 200,
      headers: {
        'Content-Type': fileData.mimeType,
        'Content-Disposition': 'inline',
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
