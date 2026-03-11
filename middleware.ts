import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  
  // API routes that should not be handled by this middleware
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get token from NextAuth
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  console.log('[Middleware] Token from NextAuth:', token ? 'present' : 'not found');

  // If no token, redirect to home
  if (!token) {
    console.log('[Middleware] No token, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[Middleware] Valid token found, allowing access');
  
  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', token.sub || '');
  requestHeaders.set('x-user-email', token.email || '');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
