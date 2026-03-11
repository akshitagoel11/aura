import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services-sqlite';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Registration request received');
    
    const body = await request.json();
    const { email, password, fullName } = body;
    
    console.log('[API] Registration data:', { email, fullName: fullName || 'N/A', hasPassword: !!password });

    // Validate input
    if (!email || !password) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      console.log('[API] Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create user with secure password hashing
    console.log('[API] Creating new user');
    const user = await userService.createUser(email, password, fullName);
    
    if (!user) {
      console.log('[API] User creation failed - email might already exist');
      return NextResponse.json(
        { error: 'Looks like you already have an account! Please login instead.', code: 'USER_EXISTS' },
        { status: 409 }
      );
    }

    console.log('[API] User created successfully:', user.id);
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Register error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
