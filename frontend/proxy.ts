import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims } = await auth();

  const role = sessionClaims?.metadata?.role;
  const isAdmin = sessionClaims?.metadata?.is_admin === true;
  const path = req.nextUrl.pathname;

  console.log('AUTH DEBUG', {
    path,
    isAuthenticated,
    role,
    isAdmin,
  });

  // Not authenticated → login
  if (path.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admins have unrestricted dashboard access.
  // This MUST happen before role-based restrictions.
  if (isAuthenticated && isAdmin) {
    return NextResponse.next();
  }

  // Authenticated users without a role → onboarding
  if (
    isAuthenticated &&
    !role &&
    path.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Onboarding → appropriate dashboard
  if (path === '/onboarding') {
    if (isAuthenticated && role) {
      return NextResponse.redirect(
        new URL(`/dashboard/${role}`, req.url)
      );
    }

    return NextResponse.next();
  }

  // Student cannot access tutor/admin dashboards
  if (isAuthenticated && role === 'student') {
    if (
      path.startsWith('/dashboard/tutor') ||
      path.startsWith('/dashboard/admin')
    ) {
      return NextResponse.redirect(
        new URL('/dashboard/student', req.url)
      );
    }
  }

  // Tutor cannot access student/admin dashboards
  if (isAuthenticated && role === 'tutor') {
    if (
      path.startsWith('/dashboard/student') ||
      path.startsWith('/dashboard/admin')
    ) {
      return NextResponse.redirect(
        new URL('/dashboard/tutor', req.url)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
};