import { NextRequest, NextResponse } from 'next/server';
import { getSession, logActivity } from '@/lib/auth-db';
import { executeIntent } from '@/lib/n8n';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intent, intentType, preview } = await request.json();

    if (!intent || !intentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call n8n webhook to execute the intent
    const n8nResult = await executeIntent(session.userId.toString(), intent, intentType);

    const status = n8nResult.success ? 'executed' : 'failed';

    // Log activity
    await logActivity(session.userId, 'executed_intent', {
      intentType,
      success: n8nResult.success,
      error: n8nResult.error,
      intent,
      preview,
    });

    if (!n8nResult.success) {
      return NextResponse.json(
        { error: n8nResult.error || 'Failed to execute intent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      executionId: n8nResult.executionId,
      message: `${intentType} executed successfully`,
    });
  } catch (error) {
    console.error('[API] Execution error:', error);
    return NextResponse.json({ error: 'Failed to execute intent' }, { status: 500 });
  }
}
