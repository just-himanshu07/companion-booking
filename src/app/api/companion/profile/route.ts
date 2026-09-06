import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateCompanionSchema = z.object({
  fullName: z.string().min(2).optional(),
  displayName: z.string().min(2).optional(),
  age: z.number().min(18, 'Age must be at least 18').optional(),
  gender: z.string().optional(),
  cityId: z.string().uuid().optional(),
  hourlyPrice: z.number().min(100, 'Hourly rate must be at least ₹100').optional(),
  bio: z.string().min(20, 'Bio must be at least 20 characters').optional(),
  languages: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  activityIds: z.array(z.string()).optional(),
  profilePhoto: z.string().optional(),
  gallery: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'COMPANION' || !user.companionProfile) {
      return NextResponse.json({ error: 'Companion account required' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateCompanionSchema.parse(body);
    const companionId = user.companionProfile.id;

    await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      await tx.companionProfile.update({
        where: { id: companionId },
        data: {
          ...(validatedData.fullName && { fullName: validatedData.fullName }),
          ...(validatedData.displayName && { displayName: validatedData.displayName }),
          ...(validatedData.age && { age: validatedData.age }),
          ...(validatedData.gender && { gender: validatedData.gender }),
          ...(validatedData.cityId && { cityId: validatedData.cityId }),
          ...(validatedData.hourlyPrice && { hourlyPrice: validatedData.hourlyPrice }),
          ...(validatedData.bio && { bio: validatedData.bio }),
          ...(validatedData.languages && { languages: validatedData.languages }),
          ...(validatedData.interests && { interests: validatedData.interests }),
          ...(validatedData.profilePhoto !== undefined && { profilePhoto: validatedData.profilePhoto }),
          ...(validatedData.gallery && { gallery: validatedData.gallery }),
        },
      });

      // 2. Update activities if provided
      if (validatedData.activityIds) {
        await tx.companionActivity.deleteMany({
          where: { companionId },
        });

        for (const actId of validatedData.activityIds) {
          await tx.companionActivity.create({
            data: {
              companionId,
              activityId: actId,
            },
          });
        }
      }
    });

    const updated = await prisma.companionProfile.findUnique({
      where: { id: companionId },
      include: {
        city: true,
        activities: { include: { activity: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Companion profile updated successfully',
      profile: updated,
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

