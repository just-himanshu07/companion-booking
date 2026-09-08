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
 * Helper to fetch target profile (CustomerProfile or CompanionProfile) for a user
 */
async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: true,
      companionProfile: true,
    },
  });

  if (!user) return null;

  if (user.companionProfile) {
    return {
      type: 'COMPANION' as const,
      user,
      profile: user.companionProfile,
      primaryPhoto: user.companionProfile.profilePhoto,
      galleryPhotos: user.companionProfile.gallery || [],
    };
  }

  if (user.customerProfile) {
    return {
      type: 'CUSTOMER' as const,
      user,
      profile: user.customerProfile,
      primaryPhoto: user.customerProfile.displayAvatar,
      galleryPhotos: user.customerProfile.gallery || [],
    };
  }

  return null;
}

/**
 * Helper to update photos in DB for Customer or Companion profile
 */
async function updateProfilePhotos(
  userId: string,
  profileType: 'CUSTOMER' | 'COMPANION',
  primaryPhoto: string | null,
  galleryPhotos: string[]
) {
  if (profileType === 'COMPANION') {
    await prisma.companionProfile.update({
      where: { userId },
      data: {
        profilePhoto: primaryPhoto,
        gallery: galleryPhotos,
      },
    });
  } else {
    await prisma.customerProfile.update({
      where: { userId },
      data: {
        displayAvatar: primaryPhoto,
        gallery: galleryPhotos,
      },
    });
  }
}

/**
 * GET /api/admin/photos?userId=xxx
 * Retrieve profile photos for a given user (ADMIN ONLY)
 */
export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const data = await getUserProfile(userId);
    if (!data) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId,
      role: data.user.role,
      primaryPhoto: data.primaryPhoto,
      galleryPhotos: data.galleryPhotos,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/photos
 * Upload a photo for Primary or Gallery slot (ADMIN ONLY)
 * FormData params: userId, file, target ('primary' | 'gallery'), slotIndex (optional for gallery)
 */
export async function POST(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const formData = await req.formData();

    const userId = formData.get('userId') as string | null;
    const target = (formData.get('target') as string | null) || 'primary';
    const slotIndexRaw = formData.get('slotIndex') as string | null;
    const file = formData.get('file') as File | null;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const profileData = await getUserProfile(userId);
    if (!profileData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 1. Server-Side File Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5 MB' },
        { status: 400 }
      );
    }

    const mimeType = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WEBP images are allowed.' },
        { status: 400 }
      );
    }

    // 2. Content Magic Bytes Verification
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'Security verification failed: File content does not match a valid image format.' },
        { status: 400 }
      );
    }

    // 3. Upload Image to Storage Provider
    let photoUrl = '';
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `admin-uploads/${userId}/${Date.now()}-${sanitizedFilename}`;

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

    let newPrimary = profileData.primaryPhoto;
    let newGallery = [...profileData.galleryPhotos];

    if (target === 'primary') {
      newPrimary = photoUrl;
    } else {
      // Gallery target
      const slotIndex = slotIndexRaw !== null ? parseInt(slotIndexRaw, 10) : newGallery.length;
      if (slotIndex >= 0 && slotIndex < newGallery.length) {
        newGallery[slotIndex] = photoUrl;
      } else {
        if (newGallery.length >= 4) {
          return NextResponse.json(
            { error: 'Maximum gallery limit of 4 photos reached' },
            { status: 400 }
          );
        }
        newGallery.push(photoUrl);
      }
    }

    // 4. Update Profile in DB
    await updateProfilePhotos(userId, profileData.type, newPrimary, newGallery);

    // 5. Audit Log
    await logAdminAction(
      admin.id,
      `ADMIN_UPLOAD_PHOTO_${target.toUpperCase()}`,
      'USER',
      userId,
      { target, photoUrl, slotIndex: slotIndexRaw }
    );

    return NextResponse.json({
      success: true,
      primaryPhoto: newPrimary,
      galleryPhotos: newGallery,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/photos
 * Promote a gallery photo to primary or reorder photos (ADMIN ONLY)
 * JSON body: { userId, action: 'PROMOTE_TO_PRIMARY', galleryIndex }
 */
export async function PATCH(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { userId, action, galleryIndex } = await req.json();

    if (!userId || action !== 'PROMOTE_TO_PRIMARY' || galleryIndex === undefined) {
      return NextResponse.json({ error: 'Invalid parameters provided' }, { status: 400 });
    }

    const profileData = await getUserProfile(userId);
    if (!profileData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const gallery = [...profileData.galleryPhotos];
    if (galleryIndex < 0 || galleryIndex >= gallery.length) {
      return NextResponse.json({ error: 'Invalid gallery index' }, { status: 400 });
    }

    const targetPhoto = gallery[galleryIndex];
    const updatedGallery = gallery.filter((_, i) => i !== galleryIndex);

    // Demote current primary photo to gallery if present
    if (profileData.primaryPhoto) {
      updatedGallery.unshift(profileData.primaryPhoto);
    }

    const newPrimary = targetPhoto;

    await updateProfilePhotos(userId, profileData.type, newPrimary, updatedGallery);

    await logAdminAction(
      admin.id,
      'ADMIN_PROMOTE_PHOTO_TO_PRIMARY',
      'USER',
      userId,
      { galleryIndex, promotedPhoto: targetPhoto }
    );

    return NextResponse.json({
      success: true,
      primaryPhoto: newPrimary,
      galleryPhotos: updatedGallery,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/photos
 * Remove a photo from primary or gallery (ADMIN ONLY)
 * JSON body: { userId, target: 'primary' | 'gallery', slotIndex?: number }
 */
export async function DELETE(req: Request) {
  try {
    const admin = await requireRole(['ADMIN']);
    const { userId, target, slotIndex } = await req.json();

    if (!userId || !target) {
      return NextResponse.json({ error: 'userId and target are required' }, { status: 400 });
    }

    const profileData = await getUserProfile(userId);
    if (!profileData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let newPrimary = profileData.primaryPhoto;
    let newGallery = [...profileData.galleryPhotos];

    if (target === 'primary') {
      if (newGallery.length > 0) {
        // Promote first gallery photo to primary if available
        newPrimary = newGallery[0];
        newGallery = newGallery.slice(1);
      } else {
        newPrimary = null;
      }
    } else if (target === 'gallery' && slotIndex !== undefined) {
      if (slotIndex >= 0 && slotIndex < newGallery.length) {
        newGallery = newGallery.filter((_, i) => i !== slotIndex);
      }
    }

    await updateProfilePhotos(userId, profileData.type, newPrimary, newGallery);

    await logAdminAction(
      admin.id,
      `ADMIN_REMOVE_PHOTO_${target.toUpperCase()}`,
      'USER',
      userId,
      { target, slotIndex }
    );

    return NextResponse.json({
      success: true,
      primaryPhoto: newPrimary,
      galleryPhotos: newGallery,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

