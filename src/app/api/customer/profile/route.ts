import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required').optional(),
  age: z.number().min(18, 'Age must be at least 18').optional(),
  gender: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  displayAvatar: z.string().nullable().optional(),
  gallery: z.array(z.string()).max(4, 'Maximum 4 additional photos allowed').optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Customer account required' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Validate photo limits: total maximum 5 photos (1 primary + 4 gallery)
    const galleryCount = validatedData.gallery ? validatedData.gallery.length : 0;
    const hasPrimary = validatedData.displayAvatar ? 1 : 0;
    if (hasPrimary + galleryCount > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos total allowed (1 Profile Photo + 4 Gallery Photos).' },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.customerProfile.update({
      where: { userId: user.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.age && { age: validatedData.age }),
        ...(validatedData.gender !== undefined && { gender: validatedData.gender }),
        ...(validatedData.city !== undefined && { city: validatedData.city }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.interests && { interests: validatedData.interests }),
        ...(validatedData.languages && { languages: validatedData.languages }),
        ...(validatedData.displayAvatar !== undefined && { displayAvatar: validatedData.displayAvatar }),
        ...(validatedData.gallery !== undefined && { gallery: validatedData.gallery }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
