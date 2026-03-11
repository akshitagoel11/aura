'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { Plus, Calendar, Flag, CheckCircle, Circle, Clock } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'executed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  intentType?: string;
  payload?: any;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        const taskActivities = data.activities
          .filter((activity: any) => activity.intentType === 'task')
          .map((activity: any): Task => ({
            id: parseInt(activity.id.replace('task_', '')),
            title: activity.title || activity.intentText || 'Untitled Task',
            description: activity.description,
            status: activity.status === 'executed' ? 'completed' : activity.status,
            priority: activity.priority || 'medium',
            dueDate: activity.payload?.scheduledDate,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            intentType: activity.intentType,
            payload: activity.payload
          }));
        
        setTasks(taskActivities);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    const interval = setInterval(fetchTasks, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Failed to update task:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const tasksByPriority = {
    high: filteredTasks.filter(t => t.priority === 'high'),
    medium: filteredTasks.filter(t => t.priority === 'medium'),
    low: filteredTasks.filter(t => t.priority === 'low')
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
      return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
                <p className="text-muted-foreground">Real-time task management with priority and completion tracking</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({tasks.length})
                </Button>
                <Button 
                  variant={filter === 'pending' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  Pending ({tasks.filter(t => t.status !== 'completed').length})
                </Button>
                <Button 
                  variant={filter === 'completed' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed ({tasks.filter(t => t.status === 'completed').length})
                </Button>
              </div>
            </div>

            {/* Tasks by Priority */}
            {Object.entries(tasksByPriority).map(([priority, priorityTasks]) => (
              <Card key={priority}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    <Flag className={`w-5 h-5 ${
                      priority === 'high' ? 'text-red-500' : 
                      priority === 'medium' ? 'text-yellow-500' : 
                      'text-green-500'
                    }`} />
                    {priority} Priority ({priorityTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {priorityTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No {priority} priority tasks
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {priorityTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <button
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className="mt-1 flex-shrink-0"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium truncate ${
                                task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {task.title}
                              </h4>
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              {task.payload?.executionResult?.messageId && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  ✓ Executed
                                </Badge>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Created {new Date(task.createdAt).toLocaleDateString()}
                              </span>
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {task.payload?.completedAt && (
                                <span className="text-green-600">
                                  Completed {new Date(task.payload.completedAt).toLocaleDateString()}
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
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
