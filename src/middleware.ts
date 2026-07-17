import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // 1. Pass-through criteria: Allow API routes, Next.js internal static assets, public assets, and the maintenance page itself
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/maintenance' ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/attireburg-logo.png' ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Check for preview bypass via query parameter or browser cookie
  const previewParam = url.searchParams.get('preview');
  const previewCookie = request.cookies.get('attire_preview')?.value;

  if (previewParam === 'attire2024' || previewCookie === 'attire2024') {
    const response = NextResponse.next();

    // If query parameter is used to authenticate, set the persistent session cookie
    if (previewParam === 'attire2024' && previewCookie !== 'attire2024') {
      response.cookies.set('attire_preview', 'attire2024', {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    return response;
  }

  // 3. Otherwise, redirect all non-bypassed requests to the maintenance page
  url.pathname = '/maintenance';
  return NextResponse.redirect(url);
}

// Limit the middleware to execute on routes, avoiding standard next static paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
