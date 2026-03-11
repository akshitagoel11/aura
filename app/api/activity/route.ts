import { NextRequest, NextResponse } from 'next/server';
import { sessionService, aiActionService, taskService } from '@/lib/services-sqlite';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Activity GET request received');
    const sessionToken = request.cookies.get('session_token')?.value;
    console.log('[API] Activity session token:', sessionToken ? 'present' : 'missing');
    const session = await sessionService.getSession(sessionToken || '');
    console.log('[API] Activity session result:', session ? 'valid' : 'invalid');
    
    if (!session) {
      console.log('[API] Activity: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's AI actions with real-time updates
    const actions = await aiActionService.getUserAIActions(session.userId, 50);
    console.log('[API] Activity: Found', actions.length, 'AI actions');
    
    // Get user's tasks for additional activity tracking
    const tasks = await taskService.getUserTasks(session.userId);
    console.log('[API] Activity: Found', tasks.length, 'tasks');
    
    // Combine and format activities
    const activities = actions.map(action => ({
      id: action.id,
      type: 'ai_action' as const,
      intentText: action.intentText,
      intentType: action.intentType,
      previewData: action.previewData ? JSON.parse(action.previewData) : null,
      executionData: action.executionData ? JSON.parse(action.executionData) : null,
      status: action.status,
      confidenceScore: action.confidenceScore,
      reasoning: action.reasoning,
      createdAt: action.createdAt,
      isCompleted: action.status === 'executed'
    }));

    // Add task activities
    const taskActivities = tasks.map((task: any) => ({
      id: `task_${task.id}`,
      type: 'task' as const,
      title: task.title,
      intentType: task.intentType,
      description: task.description,
      status: task.status,
      priority: task.priority,
      payload: task.payload ? JSON.parse(task.payload) : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      isCompleted: task.status === 'completed'
    }));

    // Combine and sort by most recent
    const allActivities = [...activities, ...taskActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('[API] Activity: Total activities:', allActivities.length);
    console.log('[API] Activity: Email activities:', allActivities.filter(a => a.intentType === 'email').length);
    console.log('[API] Activity: Task activities:', allActivities.filter(a => a.intentType === 'task').length);
    console.log('[API] Activity: Reminder activities:', allActivities.filter(a => a.intentType === 'reminder').length);

    return NextResponse.json({
      activities: allActivities,
      summary: {
        total: allActivities.length,
        completed: allActivities.filter(a => a.isCompleted).length,
        pending: allActivities.filter(a => !a.isCompleted).length,
        byType: {
          email: allActivities.filter(a => a.intentType === 'email').length,
          task: allActivities.filter(a => a.intentType === 'task').length,
          reminder: allActivities.filter(a => a.intentType === 'reminder').length,
          chat: allActivities.filter(a => a.intentType === 'chat').length
        }
      }
    });
  } catch (error) {
    console.error('[API] Activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await sessionService.getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    // Log custom activity
    const loggedAction = await aiActionService.logAIAction(session.userId, {
      intentText: action || 'Custom action',
      intentType: 'custom',
      previewData: data,
      status: 'suggested',
      reasoning: 'User-initiated action.'
    });

    return NextResponse.json({
      success: true,
      action: loggedAction
    });
  } catch (error) {
    console.error('[API] Activity POST error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
