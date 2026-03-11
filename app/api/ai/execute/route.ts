import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '@/lib/services-sqlite';
import { aiIntentService } from '@/lib/services/aiIntentService';
import { activityService } from '@/lib/services/activityService';
import { sanitizeInput, sanitizeObject } from '@/lib/database-sqlite';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Execute request received');
    
    const sessionToken = request.cookies.get('session_token')?.value;
    console.log('[API] Session token:', sessionToken ? 'present' : 'missing');
    
    const session = await sessionService.getSession(sessionToken || '');
    console.log('[API] Session result:', session ? 'valid' : 'invalid');
    
    if (!session) {
      console.log('[API] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intent, intentType, preview } = await request.json();
    console.log('[API] Request data:', { intent, intentType, preview: preview ? 'present' : 'missing' });

    // Validate and sanitize inputs
    if (!intent || !intentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sanitizedIntent = sanitizeInput(intent);
    const sanitizedIntentType = sanitizeInput(intentType);
    const sanitizedPreview = preview ? sanitizeObject(preview) : null;

    // Validate intent type
    const validIntentTypes = ['email', 'task', 'reminder', 'chat'];
    if (!validIntentTypes.includes(sanitizedIntentType)) {
      return NextResponse.json({ error: 'Invalid intent type' }, { status: 400 });
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken(sessionToken);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google account not connected. Please connect your Google account first.' },
        { status: 401 }
      );
    }

    // Process the intent using new service
    console.log('[API] About to process intent with native services');
    const result = await aiIntentService.processIntent(
      sanitizedIntent,
      sanitizedIntentType,
      session.userId,
      accessToken || '',
      sanitizedPreview
    );
    
    console.log('[API] Processing result:', result);

    if (result.success) {
      // Log the activity
      await activityService.logActivity({
        userId: session.userId,
        actionType: getActivityType(sanitizedIntentType),
        title: sanitizedIntent,
        description: sanitizedPreview?.description || result.data?.description,
        status: 'completed',
        metadata: result.data
      });

      return NextResponse.json({
        success: true,
        message: `${sanitizedIntentType} executed successfully`,
        result: result.data,
        executionId: result.data?.taskId || result.data?.eventId || result.data?.messageId
      });
    } else {
      // Log failed attempt
      await activityService.logActivity({
        userId: session.userId,
        actionType: getActivityType(sanitizedIntentType),
        title: sanitizedIntent,
        description: `Failed: ${result.error}`,
        status: 'pending',
        metadata: { error: result.error }
      });

      return NextResponse.json(
        { error: result.error || 'Execution failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[API] Execute error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to execute intent',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
async function getGoogleAccessToken(sessionToken: string): Promise<string> {
  // In real implementation, this would:
  // 1. Get userId from session
  // 2. Look up refresh token in database
  // 3. Use refresh token to get access token
  return process.env.GOOGLE_ACCESS_TOKEN || '';
}

function getActivityType(intentType: string): 'task_created' | 'reminder_created' | 'email_sent' | 'task_completed' | 'reminder_completed' {
  switch (intentType) {
    case 'email': return 'email_sent';
    case 'task': return 'task_created';
    case 'reminder': return 'reminder_created';
    default: return 'email_sent';
  }
}
