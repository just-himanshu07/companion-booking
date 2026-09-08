import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'companion_auth_token';

// Routes requiring authentication and email verification
const PROTECTED_ROUTES = [
  '/dashboard',
  '/discover',
  '/how-it-works',
  '/faqs',
  '/feedback',
  '/companions',
  '/profile',
  '/companion-dashboard',
  '/messages',
  '/admin',
];

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);

    // Enforce email verification check for protected platform access
    if (payload && (payload.isEmailVerified === false || payload.accountStatus === 'PENDING')) {
      const verifyUrl = new URL('/verify-email', request.url);
      return NextResponse.redirect(verifyUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/discover/:path*',
    '/how-it-works/:path*',
    '/faqs/:path*',
    '/feedback/:path*',
    '/companions/:path*',
    '/profile/:path*',
    '/companion-dashboard/:path*',
    '/messages/:path*',
    '/admin/:path*',
  ],
};
