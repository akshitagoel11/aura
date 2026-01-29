import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth-db';

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

    // Check if user already exists
    console.log('[API] Checking for existing user');
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log('[API] User already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    console.log('[API] Creating new user');
    const user = await createUser(email, password, fullName);
    
    if (!user) {
      console.log('[API] User creation failed');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
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
