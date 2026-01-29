'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: number;
  action: string;
  intentType?: string;
  status: 'executed' | 'failed' | 'pending';
  createdAt: string;
  details?: Record<string, unknown>;
}

export function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activity');
        if (!response.ok) throw new Error('Failed to fetch activities');
        const data = await response.json();
        setActivities(data.activities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getActionLabel = (action: string, intentType?: string) => {
    if (action === 'executed_intent') {
      return `Executed ${intentType}`;
    }
    return action.replace(/_/g, ' ').charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent AI intent executions and activities</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-muted-foreground">Loading activities...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && activities.length === 0 && (
          <p className="text-muted-foreground">No activities yet</p>
        )}
        {!loading && activities.length > 0 && (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <div className="w-0.5 h-8 bg-border" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {getActionLabel(activity.action, activity.intentType)}
                    </p>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
