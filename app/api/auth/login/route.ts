import { NextRequest, NextResponse } from 'next/server';
import { getUserWithPassword, createSession, verifyPassword, logActivity } from '@/lib/auth-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[v0] Login attempt with email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[v0] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user with password hash
    console.log('[v0] Looking up user:', email);
    const user = await getUserWithPassword(email);
    
    if (!user) {
      console.log('[v0] User not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    console.log('[v0] User found, verifying password');

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    console.log('[v0] Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('[v0] Invalid password for:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    console.log('[v0] Creating session for user:', user.id);
    const sessionToken = await createSession(user.id);
    console.log('[v0] Session token created');

    // Log login activity
    await logActivity(user.id, 'login', {
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Create response with session cookie
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      },
      { status: 200 }
    );

    // Set secure session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
