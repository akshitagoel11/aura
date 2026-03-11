export interface Activity {
  id: string;
  userId: number;
  actionType: 'task_created' | 'reminder_created' | 'email_sent' | 'task_completed' | 'reminder_completed';
  title: string;
  description?: string;
  timestamp: string;
  status: 'pending' | 'completed';
  metadata?: any;
}

export interface ActivityFilter {
  userId: number;
  limit?: number;
  actionType?: string;
  status?: string;
}

export class ActivityService {
  private activities: Activity[] = [];

  async logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> {
    const newActivity: Activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: activity.userId,
      actionType: activity.actionType,
      title: activity.title,
      description: activity.description,
      timestamp: new Date().toISOString(),
      status: activity.status,
      metadata: activity.metadata
    };

    this.activities.push(newActivity);
    
    // In a real implementation, this would save to database
    console.log('[Activity] Logged:', newActivity);
    
    return newActivity;
  }

  async getUserActivities(filter: ActivityFilter): Promise<Activity[]> {
    // In a real implementation, this would query the database
    const userActivities = this.activities
      .filter(activity => activity.userId === filter.userId)
      .filter(activity => !filter.actionType || activity.actionType === filter.actionType)
      .filter(activity => !filter.status || activity.status === filter.status)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filter.limit ? userActivities.slice(0, filter.limit) : userActivities;
  }

  async updateActivityStatus(activityId: string, status: 'pending' | 'completed'): Promise<void> {
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      activity.status = status;
      activity.timestamp = new Date().toISOString();
      console.log('[Activity] Updated status:', activityId, '->', status);
    }
  }

  async getRecentActivities(userId: number, limit: number = 50): Promise<{
    total: number;
    completed: number;
    pending: number;
    byType: {
      email: number;
      task: number;
      reminder: number;
      chat: number;
    };
    activities: Activity[];
  }> {
    const userActivities = await this.getUserActivities({ userId, limit });
    
    const completed = userActivities.filter(a => a.status === 'completed').length;
    const pending = userActivities.filter(a => a.status === 'pending').length;
    
    const byType = {
      email: userActivities.filter(a => a.actionType.includes('email')).length,
      task: userActivities.filter(a => a.actionType.includes('task')).length,
      reminder: userActivities.filter(a => a.actionType.includes('reminder')).length,
      chat: userActivities.filter(a => a.actionType.includes('chat')).length
    };

    return {
      total: userActivities.length,
      completed,
      pending,
      byType,
      activities: userActivities
    };
  }

  // Helper methods for creating specific activity types
  async logTaskCreated(userId: number, title: string, description?: string, metadata?: any): Promise<Activity> {
    return this.logActivity({
      userId,
      actionType: 'task_created',
      title,
      description,
      status: 'pending',
      metadata
    });
  }

  async logReminderCreated(userId: number, title: string, description?: string, metadata?: any): Promise<Activity> {
    return this.logActivity({
      userId,
      actionType: 'reminder_created',
      title,
      description,
      status: 'pending',
      metadata
    });
  }

  async logEmailSent(userId: number, title: string, to: string, metadata?: any): Promise<Activity> {
    return this.logActivity({
      userId,
      actionType: 'email_sent',
      title,
      description: `To: ${to}`,
      status: 'completed',
      metadata
    });
  }

  async logTaskCompleted(userId: number, taskId: string, metadata?: any): Promise<Activity> {
    return this.logActivity({
      userId,
      actionType: 'task_completed',
      title: `Task completed: ${taskId}`,
      status: 'completed',
      metadata
    });
  }

  async logReminderCompleted(userId: number, eventId: string, metadata?: any): Promise<Activity> {
    return this.logActivity({
      userId,
      actionType: 'reminder_completed',
      title: `Reminder completed: ${eventId}`,
      status: 'completed',
      metadata
    });
  }
}

export const activityService = new ActivityService();
