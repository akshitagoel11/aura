import { NextRequest, NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/googleAuthService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authUrl = googleAuthService.getAuthUrl();
    
    return NextResponse.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('[Google Auth] Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}
