import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-db';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      // Delete session from database
      await deleteSession(sessionToken);
    }

    // Create response and clear session cookie
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
