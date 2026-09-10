import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { prisma } from './db';
import { Role, AccountStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'companion_super_secret_jwt_key_2026_production';
const AUTH_COOKIE_NAME = 'companion_auth_token';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  accountStatus?: AccountStatus;
  isEmailVerified?: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Request-memoized lightweight session lookup for authentication & authorization checks.
 * Avoids joining customer & companion profile tables unless full profile context is required.
 */
export const getMinimalSessionUser = cache(async () => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        isRegistrationFeePaid: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    return user;
  } catch (err) {
    return null;
  }
});

/**
 * Request-memoized full session user lookup with profile context.
 * Uses React.cache to guarantee 0 duplicate DB queries per HTTP request lifecycle.
 */
export const getSessionUser = cache(async () => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        isRegistrationFeePaid: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        customerProfile: true,
        companionProfile: {
          select: {
            id: true,
            userId: true,
            username: true,
            displayName: true,
            fullName: true,
            age: true,
            gender: true,
            cityId: true,
            bio: true,
            languages: true,
            interests: true,
            gallery: true,
            profilePhoto: true,
            verificationStatus: true,
            hourlyPrice: true,
            averageRating: true,
            totalReviews: true,
            city: { select: { id: true, name: true } },
            activities: { select: { activityId: true, activity: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      isRegistrationFeePaid: user.isRegistrationFeePaid,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      customerProfile: user.customerProfile,
      companionProfile: user.companionProfile,
    };
  } catch (err) {
    return null;
  }
});

export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false;

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function removeAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireMinimalAuth() {
  const user = await getMinimalSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireVerifiedAuth() {
  const user = await requireAuth();
  if (!user.isEmailVerified || user.accountStatus !== 'ACTIVE') {
    throw new Error('VERIFICATION_REQUIRED');
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireMinimalAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
