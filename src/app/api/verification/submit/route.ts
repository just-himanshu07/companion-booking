import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveSecureKYCFile } from '@/lib/kycStorage';
import { KYCDocumentType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    if (user.role === 'CUSTOMER' && !user.isRegistrationFeePaid) {
      return NextResponse.json(
        { error: 'PAYMENT_REQUIRED', message: 'Please complete your ₹399 registration fee payment first.' },
        { status: 403 }
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'VERIFICATION_REQUIRED', message: 'Please verify your email address first.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const documentType = formData.get('documentType') as string;
    const documentFront = formData.get('documentFront') as File | null;
    const documentBack = formData.get('documentBack') as File | null;
    const selfie = formData.get('selfie') as File | null;

    if (!documentType || !Object.values(KYCDocumentType).includes(documentType as KYCDocumentType)) {
      return NextResponse.json(
        { error: 'Please select a valid supported government ID document type.' },
        { status: 400 }
      );
    }

    if (!documentFront || documentFront.size === 0) {
      return NextResponse.json(
        { error: 'Government ID front document image/file is required.' },
        { status: 400 }
      );
    }

    if (!selfie || selfie.size === 0) {
      return NextResponse.json(
        { error: 'A live selfie photograph is required for identity verification.' },
        { status: 400 }
      );
    }

    // Save files securely to private storage
    const frontResult = await saveSecureKYCFile(documentFront, 'doc_front');
    const selfieResult = await saveSecureKYCFile(selfie, 'selfie');

    let backResult = null;
    if (documentBack && documentBack.size > 0) {
      backResult = await saveSecureKYCFile(documentBack, 'doc_back');
    }

    // Upsert IdentityVerification record & set user accountStatus to UNDER_REVIEW
    await prisma.$transaction(async (tx) => {
      await tx.identityVerification.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          documentType: documentType as KYCDocumentType,
          documentFrontUrl: frontResult.fileUrl,
          documentBackUrl: backResult ? backResult.fileUrl : null,
          selfieUrl: selfieResult.fileUrl,
          status: 'UNDER_REVIEW',
          rejectionReason: null,
        },
        update: {
          documentType: documentType as KYCDocumentType,
          documentFrontUrl: frontResult.fileUrl,
          documentBackUrl: backResult ? backResult.fileUrl : null,
          selfieUrl: selfieResult.fileUrl,
          status: 'UNDER_REVIEW',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          accountStatus: 'UNDER_REVIEW',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Identity verification documents submitted successfully. Your account is now under review.',
      accountStatus: 'UNDER_REVIEW',
      redirectTo: '/dashboard',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to submit identity verification' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Identity verification submission failed. Please try again.' },
      { status: 500 }
    );
  }
}

