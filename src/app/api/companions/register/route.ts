import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { companionRegisterSchema } from '@/lib/validators';
import { signToken, setAuthCookie } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = companionRegisterSchema.parse(body);

    if (validatedData.age < 18) {
      return NextResponse.json({ error: 'Companions must be at least 18 years old.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const existingUsername = await prisma.companionProfile.findUnique({
      where: { username: validatedData.displayName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(1000 + Math.random() * 9000) },
    });

    const username = validatedData.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        role: 'COMPANION',
        isEmailVerified: true,
        isRegistrationFeePaid: true, // Companions undergo verification instead of customer fee
        companionProfile: {
          create: {
            username,
            fullName: validatedData.fullName,
            displayName: validatedData.displayName,
            age: validatedData.age,
            gender: validatedData.gender,
            cityId: validatedData.cityId,
            hourlyPrice: validatedData.hourlyPrice,
            bio: validatedData.bio,
            languages: validatedData.languages,
            interests: validatedData.interests,
            profilePhoto: validatedData.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            verificationStatus: 'PENDING',
            activities: {
              create: validatedData.activityIds.map((activityId) => ({
                activity: { connect: { id: activityId } },
              })),
            },
          },
        },
      },
      include: {
        companionProfile: true,
      },
    });

    // Default 7 days availability slots creation
    const today = new Date();
    if (user.companionProfile) {
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const timeSlots = [
          { startTime: '10:00', endTime: '12:00' },
          { startTime: '14:00', endTime: '16:00' },
          { startTime: '18:00', endTime: '20:00' },
        ];
        for (const slot of timeSlots) {
          await prisma.availabilitySlot.create({
            data: {
              companionId: user.companionProfile.id,
              date: dateStr,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBooked: false,
            },
          });
        }
      }
    }

    await createNotification(
      user.id,
      'Companion Application Submitted',
      'Your profile has been received and is under verification. Our safety team will review your details shortly.',
      'VERIFICATION',
      '/companion-dashboard'
    );

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companionProfile: user.companionProfile,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Companion registration failed' }, { status: 500 });
  }
}

