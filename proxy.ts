import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth-db';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  
  // API routes should not be handled by this middleware
  if (pathname.startsWith('/api/') || publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get('session_token')?.value;
  console.log('[Proxy] Session token from cookies:', sessionToken);

  // If no session token, redirect to login
  if (!sessionToken) {
    console.log('[Proxy] No session token, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify session
    console.log('[Proxy] Verifying session token:', sessionToken);
    const session = await getSession(sessionToken);
    console.log('[Proxy] Session found:', session ? 'Yes' : 'No');

    if (!session) {
      // Session expired or invalid
      console.log('[Proxy] Session invalid, redirecting to login');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }

    // Add user info to request headers for use in route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId.toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('[v0] Proxy error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
