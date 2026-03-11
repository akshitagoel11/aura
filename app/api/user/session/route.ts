import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session found'
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user
    });

  } catch (error) {
    console.error('[User Session] Error:', error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
