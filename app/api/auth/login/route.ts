import { NextRequest, NextResponse } from 'next/server';
import { userService, sessionService } from '@/lib/services-sqlite';
import { verifyPassword } from '@/lib/database-sqlite';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Login request received');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('[API] Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[API] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user with password hash
    console.log('[API] Authenticating user');
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      console.log('[API] User not found:', email);
      return NextResponse.json(
        { error: 'No account found with this email. Please register first.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify password
    console.log('[API] Password verification attempt');
    console.log('[API] User data:', { 
      userId: user.id, 
      hasPasswordHash: !!user.passwordHash, 
      hasSalt: !!user.salt,
      passwordHashLength: user.passwordHash?.length,
      saltLength: user.salt?.length
    });
    
    const isValidPassword = verifyPassword(password, user.passwordHash, user.salt);
    console.log('[API] Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('[API] Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Incorrect password. Try again or reset your password.', code: 'INVALID_PASSWORD' },
        { status: 401 }
      );
    }

    // Create session
    console.log('[API] Creating session for user:', user.id);
    const session = await sessionService.createSession(user.id);
    
    if (!session) {
      console.log('[API] Failed to create session');
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('[API] Login successful for user:', user.id);
    
    // Set session cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      }
    });

    response.cookies.set('session_token', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('[API] Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
