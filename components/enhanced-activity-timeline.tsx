'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter
} from 'lucide-react';

interface AIAction {
  id: number;
  intentText: string;
  intentType: string;
  previewData: any;
  executionData: any;
  status: 'suggested' | 'confirmed' | 'executed' | 'cancelled' | 'failed';
  confidenceScore: number | null;
  reasoning: string | null;
  createdAt: string;
}

interface ActivityTimelineProps {
  userId?: number;
  refreshKey?: number;
}

export function EnhancedActivityTimeline({ userId, refreshKey }: ActivityTimelineProps) {
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Helper function to validate date strings
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getTime() > 0;
  };

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/activity');
        if (!response.ok) throw new Error('Failed to fetch activities');
        const data = await response.json();
        setActions(data.actions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [refreshKey]);

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return CheckCircle;
      case 'confirmed': return Eye;
      case 'failed': return XCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getIntentTypeIcon = (intentType: string) => {
    switch (intentType) {
      case 'email': return '📧';
      case 'task': return '📋';
      case 'reminder': return '⏰';
      case 'chat': return '💬';
      default: return '🤖';
    }
  };

  const getConfidenceColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredActions = actions.filter(action => {
    if (filter === 'all') return true;
    return action.status === filter;
  });

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Activity Timeline
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
            <Brain className="w-5 h-5" />
            AI Activity Timeline
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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Activity Timeline
            </CardTitle>
            <CardDescription>
              Complete audit log of all AI interactions and decisions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-input text-foreground border border-border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="suggested">Suggested</option>
              <option value="confirmed">Confirmed</option>
              <option value="executed">Executed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No AI activities yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActions.map((action) => {
              const StatusIcon = getStatusIcon(action.status);
              const isExpanded = expandedItems.has(action.id);
              
              return (
                <div
                  key={action.id}
                  className="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getIntentTypeIcon(action.intentType)}</span>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getStatusColor(action.status)}>
                            {action.status}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/20 text-primary-foreground">
                            {action.intentType}
                          </Badge>
                          {action.confidenceScore && (
                            <span className={`text-sm ${getConfidenceColor(action.confidenceScore)}`}>
                              {Math.round(action.confidenceScore * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{action.intentText}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.createdAt && isValidDate(action.createdAt) 
                            ? formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })
                            : 'Unknown time'
                          }
                        </p>
                        
                        {action.reasoning && (
                          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                            <strong>AI Reasoning:</strong> {action.reasoning}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(action.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-border pt-3">
                      {action.previewData && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Preview Data:</h4>
                          <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(action.previewData, null, 2)}
                          </pre>
                        </div>
                      )}
                      {action.executionData && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Execution Data:</h4>
                          <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(action.executionData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
