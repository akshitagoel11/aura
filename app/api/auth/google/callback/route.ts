import { NextRequest, NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/googleAuthService';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/?error=auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await googleAuthService.exchangeCodeForTokens(code);
    
    // Get user info
    const userInfo = await googleAuthService.getUserInfo(tokens.accessToken);
    
    // Save or update user in database
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: { 
        googleRefreshToken: tokens.refreshToken,
        updatedAt: new Date()
      },
      create: {
        email: userInfo.email,
        googleRefreshToken: tokens.refreshToken
      }
    });

    // Create session token
    const sessionToken = randomBytes(32).toString('hex');
    
    // Store session in database
    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date()
      }
    });

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    );

    // Set secure HTTP cookie with session token
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Also set user email for backward compatibility
    response.cookies.set('user_email', userInfo.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('[Google Auth] Error in callback:', error);
    return NextResponse.redirect(
      new URL('/?error=callback_failed', request.url)
    );
  }
}
