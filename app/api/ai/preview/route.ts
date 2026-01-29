import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-db';
import { generateIntentPreview } from '@/lib/n8n';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intent, intentType } = await request.json();

    if (!intent || !intentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call n8n webhook to generate preview
    const preview = await generateIntentPreview(session.userId.toString(), intent, intentType);

    if (!preview) {
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('[API] Preview error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
