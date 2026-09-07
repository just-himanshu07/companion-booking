import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { put } from '@vercel/blob';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates file magic bytes (first few bytes) to ensure file is genuinely a valid image.
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

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. File size check (Server-side validation)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5 MB per image' },
        { status: 400 }
      );
    }

    // 4. File MIME type check (Server-side validation)
    const mimeType = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WEBP images are allowed.' },
        { status: 400 }
      );
    }

    // 5. Buffer & Magic Bytes verification
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'Security verification failed: File content does not match a valid image format.' },
        { status: 400 }
      );
    }

    // 6. Storage Execution
    // If Vercel Blob token is available, upload directly to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `paireva-photos/${user.id}/${Date.now()}-${sanitizedName}`;

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: true,
      });

      return NextResponse.json({
        success: true,
        url: blob.url,
        size: file.size,
        type: mimeType,
      });
    }

    // Fallback for local development environment (Data URL format)
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      size: file.size,
      type: mimeType,
      isLocalDev: true,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Image upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

