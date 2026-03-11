'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  CheckSquare, 
  Bell, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Circle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'ai_action' | 'task';
  intentText?: string;
  title?: string;
  intentType: 'email' | 'task' | 'reminder' | 'chat';
  status: string;
  priority?: string;
  createdAt: string;
  updatedAt?: string;
  isCompleted: boolean;
  previewData?: any;
  executionData?: any;
  description?: string;
}

interface ActivitySummary {
  total: number;
  completed: number;
  pending: number;
  byType: {
    email: number;
    task: number;
    reminder: number;
    chat: number;
  };
}

export default function RealTimeActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activity');
      console.log('[RealTimeActivity] Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[RealTimeActivity] Received data:', data);
        setActivities(data.activities || []);
        setSummary(data.summary || {
          total: 0,
          completed: 0,
          pending: 0,
          byType: { email: 0, task: 0, reminder: 0, chat: 0 }
        });
      } else {
        console.error('[RealTimeActivity] Failed to fetch activities:', response.statusText);
      }
    } catch (error) {
      console.error('[RealTimeActivity] Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getIntentIcon = (intentType: string) => {
    switch (intentType) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-500';
    switch (status) {
      case 'executed': return 'bg-green-500';
      case 'confirmed': return 'bg-blue-500';
      case 'suggested': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                </div>
                <Circle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-time Activity Feed
              </CardTitle>
              <CardDescription>
                Latest activities and updates from your AI assistant
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchActivities}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activities yet. Start by sending an email or creating a task!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${getStatusColor(activity.status, activity.isCompleted)}`}>
                    {getIntentIcon(activity.intentType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {activity.intentText || activity.title}
                      </h4>
                      {activity.priority && (
                        <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="capitalize">
                        {activity.intentType}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.previewData?.preview?.message || 
                       activity.previewData?.preview?.description ||
                       activity.description ||
                       'No description available'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        {activity.isCompleted ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-yellow-500" />
                        )}
                        {activity.isCompleted ? 'Completed' : activity.status}
                      </span>
                      {activity.executionData?.result?.messageId && (
                        <span className="text-green-600">
                          ✓ Sent to {activity.intentType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
