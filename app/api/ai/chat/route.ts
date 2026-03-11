import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAIResponse } from '@/lib/groq';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[AI Chat] Request received');
    const session = await getServerSession();
    console.log('[AI Chat] Session:', session?.user?.email ? 'Authenticated' : 'Not authenticated');
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    const { message } = await request.json();
    console.log('[AI Chat] Message:', message);
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    console.log('[AI Chat] Calling getAIResponse...');
    const aiResponse = await getAIResponse(message);
    console.log('[AI Chat] AI Response:', aiResponse);

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
