import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'companion_auth_token';

// Routes requiring authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/discover',
  '/how-it-works',
  '/faqs',
  '/companions',
  '/profile',
  '/companion-dashboard',
  '/messages',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname matches any protected route
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/discover/:path*',
    '/how-it-works/:path*',
    '/faqs/:path*',
    '/companions/:path*',
    '/profile/:path*',
    '/companion-dashboard/:path*',
    '/messages/:path*',
    '/admin/:path*',
  ],
};
