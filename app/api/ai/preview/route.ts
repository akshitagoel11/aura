import { NextRequest, NextResponse } from 'next/server';
import { sessionService, aiActionService, cognitiveLoadService } from '@/lib/services-sqlite';
import { sanitizeInput } from '@/lib/database-sqlite';
import { generateIntentPreview } from '@/lib/n8n-simple';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await sessionService.getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intent, intentType, regenerate = false, previousDraft = null } = await request.json();

    // Validate and sanitize inputs
    if (!intent || !intentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sanitizedIntent = sanitizeInput(intent);
    const sanitizedIntentType = sanitizeInput(intentType);

    // Validate intent type
    const validIntentTypes = ['email', 'task', 'reminder', 'chat'];
    if (!validIntentTypes.includes(sanitizedIntentType)) {
      return NextResponse.json({ error: 'Invalid intent type' }, { status: 400 });
    }

    // Log the AI suggestion
    await aiActionService.logAIAction(session.userId, {
      intentText: sanitizedIntent,
      intentType: sanitizedIntentType,
      status: regenerate ? 'suggested' : 'suggested', // Use 'suggested' for both cases
      confidenceScore: 0.85,
      reasoning: regenerate ? `User requested regeneration of ${sanitizedIntentType}` : `AI identified this as a ${sanitizedIntentType} request`
    });

    // Call n8n webhook to generate AI-powered preview
    const preview = await generateIntentPreview(
      session.userId.toString(), 
      sanitizedIntent, 
      sanitizedIntentType,
      regenerate,
      previousDraft
    );

    if (!preview) {
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }

    // Update cognitive load
    await cognitiveLoadService.calculateAndUpdateCognitiveLoad(session.userId);

    return NextResponse.json(preview);
  } catch (error) {
    console.error('[API] Preview error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
