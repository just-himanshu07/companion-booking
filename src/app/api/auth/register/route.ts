import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { customerRegisterSchema } from '@/lib/validators';
import { signToken, setAuthCookie } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: 'Please agree to the Terms & Conditions and Privacy Policy to continue.' },
        { status: 400 }
      );
    }

    const validatedData = customerRegisterSchema.parse(body);

    // 18+ check
    if (validatedData.age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register.' },
        { status: 400 }
      );
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      include: { customerProfile: true },
    });

    if (existingUser) {
      if (existingUser.role === 'CUSTOMER' && !existingUser.isRegistrationFeePaid) {
        const isPasswordMatch = await bcrypt.compare(validatedData.password, existingUser.passwordHash);
        if (isPasswordMatch) {
          return NextResponse.json({
            success: true,
            resumed: true,
            message: 'Existing registration found. Please complete the ₹399 payment.',
            user: {
              id: existingUser.id,
              email: existingUser.email,
              role: existingUser.role,
              accountStatus: existingUser.accountStatus,
              isEmailVerified: existingUser.isEmailVerified,
              isRegistrationFeePaid: existingUser.isRegistrationFeePaid,
              customerProfile: existingUser.customerProfile,
            },
            step: 2,
          });
        }
      }
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        phone: validatedData.phone,
        role: 'CUSTOMER',
        accountStatus: 'PENDING',
        isEmailVerified: false,
        isRegistrationFeePaid: false,
        customerProfile: {
          create: {
            name: validatedData.name,
            age: validatedData.age,
            gender: validatedData.gender,
            city: validatedData.city,
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    // Create welcome notification
    await createNotification(
      user.id,
      'Welcome to Companion Marketplace!',
      'Please complete the one-time ₹399 registration fee to start booking verified companions.',
      'SYSTEM',
      '/profile'
    );

    // NOTE: DO NOT set auth cookie yet. Auth session is created ONLY after verified payment + verified OTP.
    return NextResponse.json({
      success: true,
      message: 'Account created. Please complete the ₹399 registration fee payment.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        isRegistrationFeePaid: user.isRegistrationFeePaid,
        customerProfile: user.customerProfile,
      },
      step: 2,
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}

