import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API routes are working' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Test API] Received:', body);
    
    return NextResponse.json({ 
      success: true, 
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test API] Error:', error);
    return NextResponse.json({ error: 'Test API failed' }, { status: 500 });
  }
}
