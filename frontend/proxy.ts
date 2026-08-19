import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  const isAdmin = sessionClaims?.metadata?.is_admin === true;
  const path = req.nextUrl.pathname;

  if (path === '/onboarding') {
    // Already onboarded? Send them to their dashboard instead.
    if (isAuthenticated && role) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }
    return NextResponse.next();
  }

  // Authenticated but no role yet — force onboarding (admins skip this too).
  if (isAuthenticated && !role && !isAdmin && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Prevent students from accessing tutor routes and vice versa — admins exempt.
  if (isAuthenticated && role && !isAdmin) {
    const wrongRole =
      (role === 'student' && path.startsWith('/dashboard/tutor')) ||
      (role === 'tutor' && path.startsWith('/dashboard/student'));
    if (wrongRole) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
};