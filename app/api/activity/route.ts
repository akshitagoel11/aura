import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-simple';

// In-memory activity storage (development only)
let activities: any[] = [];
let nextActivityId = 1;

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const session = await getSession(sessionToken || '');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return activities for the current user
    const userActivities = activities
      .filter(activity => activity.userId === session.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return NextResponse.json({ activities: userActivities });
  } catch (error) {
    console.error('[API] Activity fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// Export function to add activities (used by auth-simple logActivity)
export function addActivity(userId: number, action: string, details: any, status: string = 'pending', intentType?: string) {
  const activity = {
    id: nextActivityId++,
    userId,
    action,
    intentType,
    status,
    createdAt: new Date().toISOString(),
    details,
  };
  
  activities.push(activity);
  return activity;
}
