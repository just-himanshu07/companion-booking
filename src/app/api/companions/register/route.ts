import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSessionUser, signToken, setAuthCookie } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      fullName,
      displayName,
      age,
      gender,
      cityId,
      phone,
      hourlyPrice,
      bio,
      languages,
      interests,
      activityIds,
      profilePhoto,
      agreeToTerms,
    } = body;

    // 1. Mandatory 18+ Age & Agreement Validation
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      return NextResponse.json({ error: 'You must be at least 18 years old to become a companion.' }, { status: 400 });
    }

    if (!agreeToTerms) {
      return NextResponse.json({ error: 'You must confirm that you are 18+ and agree to Paireva Companion Guidelines.' }, { status: 400 });
    }

    if (!fullName || !displayName || !cityId || !hourlyPrice || !bio) {
      return NextResponse.json({ error: 'Please fill in all required profile fields.' }, { status: 400 });
    }

    const hourlyPriceNum = parseFloat(hourlyPrice);
    if (isNaN(hourlyPriceNum) || hourlyPriceNum < 100) {
      return NextResponse.json({ error: 'Hourly rate must be at least ₹100.' }, { status: 400 });
    }

    // Check if user is currently logged in via session
    const currentUser = await getSessionUser();

    let user;
    const defaultPhoto = profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

    if (currentUser) {
      // User is already authenticated
      user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { companionProfile: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'Session user not found. Please log in again.' }, { status: 401 });
      }

      if (phone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone },
        });
      }

      if (user.companionProfile) {
        // Update existing companion profile
        const updatedProfile = await prisma.companionProfile.update({
          where: { id: user.companionProfile.id },
          data: {
            fullName,
            displayName,
            age: ageNum,
            gender: gender || 'Female',
            cityId,
            hourlyPrice: hourlyPriceNum,
            bio,
            languages: Array.isArray(languages) ? languages : ['English', 'Hindi'],
            interests: Array.isArray(interests) ? interests : [],
            profilePhoto: defaultPhoto,
            verificationStatus: 'PENDING', // Reset status to Pending Review on update
          },
        });

        // Update activities
        if (Array.isArray(activityIds) && activityIds.length > 0) {
          await prisma.companionActivity.deleteMany({
            where: { companionId: updatedProfile.id },
          });

          await prisma.companionActivity.createMany({
            data: activityIds.map((actId: string) => ({
              companionId: updatedProfile.id,
              activityId: actId,
            })),
          });
        }

        user.companionProfile = updatedProfile;
      } else {
        // Upgrade existing Customer to Companion role
        const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(1000 + Math.random() * 9000);

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'COMPANION',
            isRegistrationFeePaid: true,
            companionProfile: {
              create: {
                username,
                fullName,
                displayName,
                age: ageNum,
                gender: gender || 'Female',
                cityId,
                hourlyPrice: hourlyPriceNum,
                bio,
                languages: Array.isArray(languages) ? languages : ['English', 'Hindi'],
                interests: Array.isArray(interests) ? interests : [],
                profilePhoto: defaultPhoto,
                verificationStatus: 'PENDING',
                activities: {
                  create: (Array.isArray(activityIds) ? activityIds : []).map((actId: string) => ({
                    activity: { connect: { id: actId } },
                  })),
                },
              },
            },
          },
          include: { companionProfile: true },
        });
      }
    } else {
      // New User Registration
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required for new registration.' }, { status: 400 });
      }

      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in first.' }, { status: 400 });
      }

      const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(1000 + Math.random() * 9000);
      const passwordHash = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          phone: phone || null,
          role: 'COMPANION',
          isEmailVerified: true,
          isRegistrationFeePaid: true,
          companionProfile: {
            create: {
              username,
              fullName,
              displayName,
              age: ageNum,
              gender: gender || 'Female',
              cityId,
              hourlyPrice: hourlyPriceNum,
              bio,
              languages: Array.isArray(languages) ? languages : ['English', 'Hindi'],
              interests: Array.isArray(interests) ? interests : [],
              profilePhoto: defaultPhoto,
              verificationStatus: 'PENDING',
              activities: {
                create: (Array.isArray(activityIds) ? activityIds : []).map((actId: string) => ({
                  activity: { connect: { id: actId } },
                })),
              },
            },
          },
        },
        include: { companionProfile: true },
      });

      // Create authentication session cookie
      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      setAuthCookie(token);
    }

    // Default 7 days availability slots creation if none exist
    if (user.companionProfile) {
      const existingSlots = await prisma.availabilitySlot.count({
        where: { companionId: user.companionProfile.id },
      });

      if (existingSlots === 0) {
        const today = new Date();
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
    }

    await createNotification(
      user.id,
      'Companion Application Submitted',
      'Your companion profile has been submitted for review. Admin review is pending.',
      'VERIFICATION',
      '/companion-dashboard'
    );

    return NextResponse.json({
      success: true,
      status: 'Pending Review',
      message: 'Your companion profile has been submitted for review.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companionProfile: user.companionProfile,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Companion registration failed' }, { status: 500 });
  }
}
