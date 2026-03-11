import { NextRequest, NextResponse } from 'next/server';
import { sessionService, cognitiveLoadService } from '@/lib/services-sqlite';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await sessionService.getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate and get current cognitive load
    const cognitiveLoad = await cognitiveLoadService.calculateAndUpdateCognitiveLoad(session.userId);

    if (!cognitiveLoad) {
      return NextResponse.json({ 
        loadLevel: 'low',
        taskCount: 0
      });
    }

    return NextResponse.json({
      loadLevel: cognitiveLoad.loadLevel,
      taskCount: cognitiveLoad.taskCount,
      date: cognitiveLoad.date
    });
  } catch (error) {
    console.error('[API] Cognitive load error:', error);
    return NextResponse.json({ error: 'Failed to fetch cognitive load' }, { status: 500 });
  }
}
