import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  const path = req.nextUrl.pathname;

  if (path === '/onboarding') {
    // Already onboarded? Send them to their dashboard instead.
    if (isAuthenticated && role) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }
    return NextResponse.next();
  }

  // Authenticated but hasn't chosen a role yet — force onboarding.
  if (isAuthenticated && !role && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

// Prevent students from accessing tutor routes and vice versa
  if (isAuthenticated && role) {
  const wrongRole =
    (role === "student" && path.startsWith("/dashboard/tutor")) ||
    (role === "tutor" && path.startsWith("/dashboard/student"));
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