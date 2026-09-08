import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { put } from '@vercel/blob';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Server-side Magic Byte validation to ensure file content genuinely matches image formats.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    // JPEG starts with FFD8FF
    return hex.startsWith('FFD8FF');
  }

  if (mimeType.includes('png')) {
    // PNG starts with 89504E47
    return hex === '89504E47';
  }

  if (mimeType.includes('webp')) {
    // WEBP starts with RIFF (52494646) and has WEBP (57454250) at offset 8
    const isRiff = hex === '52494646';
    if (!isRiff || buffer.length < 12) return false;
    const webpHex = buffer.toString('hex', 8, 12).toUpperCase();
    return webpHex === '57454250';
  }

  return false;
}

/**
 * POST /api/admin/companions/[id]/photo
 * Upload / Replace companion profile photo (ADMIN ONLY)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Server-Side Admin Authorization
    const admin = await requireRole(['ADMIN']);
    const companionId = params.id;

    if (!companionId) {
      return NextResponse.json({ error: 'Companion ID is required' }, { status: 400 });
    }

    // 2. Verify companion profile exists
    const companion = await prisma.companionProfile.findUnique({
      where: { id: companionId },
      include: { user: true },
    });

    if (!companion) {
      return NextResponse.json({ error: 'Companion profile not found' }, { status: 404 });
    }

    // 3. Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    // 4. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5 MB' },
        { status: 400 }
      );
    }

    // 5. File MIME Type Validation
    const mimeType = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WEBP images are allowed.' },
        { status: 400 }
      );
    }

    // 6. Content Magic Bytes Verification
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'Security verification failed: File content does not match a valid image format.' },
        { status: 400 }
      );
    }

    // 7. Store Image (Vercel Blob in production / Data URL fallback in local dev)
    let photoUrl = '';
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `companion-profiles/${companion.id}/${Date.now()}-${sanitizedFilename}`;

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: true,
      });
      photoUrl = blob.url;
    } else {
      // Local development fallback format
      const base64Data = buffer.toString('base64');
      photoUrl = `data:${mimeType};base64,${base64Data}`;
    }

    // 8. Update CompanionProfile in Database
    const updatedCompanion = await prisma.companionProfile.update({
      where: { id: companionId },
      data: { profilePhoto: photoUrl },
      include: {
        user: { select: { email: true, createdAt: true } },
        city: true,
        verificationDocs: true,
      },
    });

    // 9. Record Action in Admin Audit Log
    await logAdminAction(
      admin.id,
      'UPDATE_COMPANION_PROFILE_PHOTO',
      'COMPANION_PROFILE',
      companionId,
      { previousPhoto: companion.profilePhoto, newPhoto: photoUrl }
    );

    return NextResponse.json({
      success: true,
      photoUrl,
      companion: updatedCompanion,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to upload profile photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/companions/[id]/photo
 * Remove companion profile photo (ADMIN ONLY)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Server-Side Admin Authorization
    const admin = await requireRole(['ADMIN']);
    const companionId = params.id;

    if (!companionId) {
      return NextResponse.json({ error: 'Companion ID is required' }, { status: 400 });
    }

    // 2. Verify companion profile exists
    const companion = await prisma.companionProfile.findUnique({
      where: { id: companionId },
    });

    if (!companion) {
      return NextResponse.json({ error: 'Companion profile not found' }, { status: 404 });
    }

    // 3. Remove photo (Set profilePhoto to null)
    const updatedCompanion = await prisma.companionProfile.update({
      where: { id: companionId },
      data: { profilePhoto: null },
      include: {
        user: { select: { email: true, createdAt: true } },
        city: true,
        verificationDocs: true,
      },
    });

    // 4. Record Action in Admin Audit Log
    await logAdminAction(
      admin.id,
      'REMOVE_COMPANION_PROFILE_PHOTO',
      'COMPANION_PROFILE',
      companionId,
      { previousPhoto: companion.profilePhoto }
    );

    return NextResponse.json({
      success: true,
      companion: updatedCompanion,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to remove profile photo' },
      { status: 500 }
    );
  }
}

