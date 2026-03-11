import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { createGmailClient } from '@/lib/googleClient';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[Gmail Send] Request received');
    
    const session = await getServerSession(authOptions);
    console.log('[Gmail Send] SESSION:', session);
    console.log('[Gmail Send] Session found:', !!session);
    console.log('[Gmail Send] Access token in session:', !!(session as any)?.accessToken);
    
    if (!session || !(session as any)?.accessToken) {
      console.log('[Gmail Send] No session or access token');
      return NextResponse.json({
        success: false,
        error: 'User not authenticated or no access token'
      }, { status: 401 });
    }

    const { to, subject, body } = await request.json();
    console.log('[Gmail Send] Email data:', { to, subject, bodyLength: body?.length });

    if (!to || !subject || !body) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject, body'
      }, { status: 400 });
    }

    // Create Gmail client
    const gmail = createGmailClient(session as any);
    
    // Create email message
    const emailContent = [
      `From: ${session.user?.email}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\n');

    // Encode message in base64
    const base64Message = Buffer.from(emailContent).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('[Gmail Send] Sending email...');
    
    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64Message
      }
    });

    console.log('[Gmail Send] Email sent successfully:', response.data);
    
    return NextResponse.json({
      success: true,
      messageId: response.data.id
    });

  } catch (error) {
    console.error('[Gmail Send] Error:', error);
    console.error('[Gmail Send] Error details:', JSON.stringify(error, null, 2));
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
