
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isBarbeiroRoute = createRouteMatcher(['/barbeiro(.*)']);
const isProtectedRoute = createRouteMatcher(['/meus-agendamentos(.*)']);
const isPublicRoute = createRouteMatcher(['/agendar(.*)', '/login(.*)']);
const isWebhookRoute = createRouteMatcher(['/api/webhooks(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req)) {
    // Allow unauthenticated access to webhook endpoints
    return NextResponse.next();
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    const claims = sessionClaims as unknown as { metadata?: { role?: string } } | undefined;
    const raw = claims?.metadata?.role ?? undefined;
    const role = typeof raw === 'string' ? raw.toUpperCase() : undefined;
    if (role !== 'ADMIN') {
      const url = new URL('/', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isBarbeiroRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    const claims = sessionClaims as unknown as { metadata?: { role?: string } } | undefined;
    const raw = claims?.metadata?.role ?? undefined;
    const role = typeof raw === 'string' ? raw.toUpperCase() : undefined;
    if (role !== 'BARBEIRO') {
      const url = new URL('/', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
