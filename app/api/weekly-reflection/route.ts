import { NextRequest, NextResponse } from 'next/server';
import { sessionService, aiActionService, cognitiveLoadService, taskService } from '@/lib/services-sqlite';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await sessionService.getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date range for the past 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Get AI actions for the past week
    const aiActions = await aiActionService.getUserAIActions(session.userId, 100);
    const weeklyActions = aiActions.filter(action => 
      new Date(action.createdAt) >= startDate
    );

    // Get tasks for the past week
    const tasks = await taskService.getUserTasks(session.userId);
    const weeklyTasks = tasks.filter(task => 
      new Date(task.createdAt) >= startDate
    );

    // Calculate statistics
    const totalTasks = weeklyTasks.length;
    const completedTasks = weeklyTasks.filter(t => t.status === 'executed').length;
    const pendingTasks = weeklyTasks.filter(t => t.status === 'pending').length;
    const failedTasks = weeklyActions.filter(a => a.status === 'failed').length;

    // Calculate average confidence
    const actionsWithConfidence = weeklyActions.filter(a => a.confidenceScore !== null);
    const averageConfidence = actionsWithConfidence.length > 0 
      ? actionsWithConfidence.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / actionsWithConfidence.length
      : 0;

    // Find most productive day
    const productivityByDay = new Map<string, number>();
    weeklyTasks.forEach(task => {
      if (task.status === 'executed') {
        const day = new Date(task.createdAt).toLocaleDateString('en', { weekday: 'long' });
        productivityByDay.set(day, (productivityByDay.get(day) || 0) + 1);
      }
    });

    const mostProductiveDay = productivityByDay.size > 0 
      ? Array.from(productivityByDay.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'No data';

    // Get cognitive load trend
    const cognitiveLoadData = await cognitiveLoadService.getCognitiveLoad(session.userId, 7);

    // Generate warnings
    const warnings = [];
    if (parseFloat((completedTasks / totalTasks * 100).toFixed(1)) < 50) {
      warnings.push('Low completion rate this week - consider reviewing your task management approach');
    }
    if (failedTasks > totalTasks * 0.2) {
      warnings.push('High failure rate detected - check if AI suggestions are appropriate');
    }
    if (averageConfidence < 0.7) {
      warnings.push('Low AI confidence scores - provide more specific input for better suggestions');
    }

    const overloadedDays = cognitiveLoadData.filter(d => d.loadLevel === 'overloaded').length;
    if (overloadedDays >= 3) {
      warnings.push('Multiple overloaded days detected - consider redistributing your workload');
    }

    return NextResponse.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      failedTasks,
      averageConfidence,
      mostProductiveDay,
      cognitiveLoadTrend: cognitiveLoadData.map(d => ({
        date: d.date,
        level: d.loadLevel,
        taskCount: d.taskCount
      })),
      warnings
    });
  } catch (error) {
    console.error('[API] Weekly reflection error:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly reflection' }, { status: 500 });
  }
}
