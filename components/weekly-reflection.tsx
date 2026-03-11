'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface WeeklyStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  failedTasks: number;
  averageConfidence: number;
  mostProductiveDay: string;
  cognitiveLoadTrend: Array<{ date: string; level: string; taskCount: number }>;
  warnings: string[];
}

interface WeeklyReflectionProps {
  userId?: number;
}

export default function WeeklyReflection({ userId }: WeeklyReflectionProps) {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  async function fetchWeeklyStats() {
    try {
      setLoading(true);
      const response = await fetch('/api/weekly-reflection');
      if (!response.ok) throw new Error('Failed to fetch weekly stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weekly reflection');
    } finally {
      setLoading(false);
    }
  }

  const completionRate = stats ? (stats.completedTasks / stats.totalTasks * 100).toFixed(1) : '0';
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Reflection
            </CardTitle>
            <CardDescription>
              Your productivity insights for the past 7 days
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchWeeklyStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warnings */}
        {stats.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Warnings & Recommendations
            </h4>
            <div className="space-y-1">
              {stats.warnings.map((warning, idx) => (
                <div key={idx} className="text-sm text-orange-300 bg-orange-500/10 p-2 rounded">
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalTasks}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getCompletionColor(parseFloat(completionRate))}`}>
              {completionRate}%
            </div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(stats.averageConfidence * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg AI Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.completedTasks}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Task Status Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Completed</span>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400">
                {stats.completedTasks}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">
                {stats.pendingTasks}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm">Failed</span>
              </div>
              <Badge variant="outline" className="bg-red-500/20 text-red-400">
                {stats.failedTasks}
              </Badge>
            </div>
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Most Productive Day</span>
          </div>
          <span className="text-sm text-green-300">{stats.mostProductiveDay}</span>
        </div>

        {/* Cognitive Load Trend */}
        {stats.cognitiveLoadTrend.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Cognitive Load Trend
            </h4>
            <div className="space-y-2">
              {stats.cognitiveLoadTrend.map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          day.level === 'overloaded' ? 'bg-red-500' :
                          day.level === 'high' ? 'bg-orange-500' :
                          day.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(day.taskCount * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {day.taskCount} tasks
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      day.level === 'overloaded' ? 'bg-red-500/20 text-red-400' :
                      day.level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      day.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {day.level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Key Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• You completed {stats.completedTasks} out of {stats.totalTasks} tasks this week</p>
            <p>• AI confidence averaged {Math.round(stats.averageConfidence * 100)}% across all suggestions</p>
            {parseFloat(completionRate) >= 80 && (
              <p className="text-green-400">• Excellent completion rate! Keep up the great work! 🎉</p>
            )}
            {parseFloat(completionRate) < 60 && (
              <p className="text-yellow-400">• Consider breaking down larger tasks into smaller, manageable steps</p>
            )}
            {stats.failedTasks > 0 && (
              <p className="text-red-400">• {stats.failedTasks} tasks failed - review what went wrong</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
