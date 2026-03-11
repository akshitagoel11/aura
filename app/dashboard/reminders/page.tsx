'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { Plus, Bell, Clock, Calendar, CheckCircle, Circle } from 'lucide-react';

interface Reminder {
  id: number;
  title: string;
  description?: string;
  datetime: string;
  isActive: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  type: 'email' | 'notification' | 'sms';
  createdAt: string;
  updatedAt?: string;
  status?: string;
  priority?: string;
  payload?: any;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        const reminderActivities = data.activities
          .filter((activity: any) => activity.intentType === 'reminder')
          .map((activity: any): Reminder => ({
            id: parseInt(activity.id.replace('task_', '')),
            title: activity.title || activity.intentText || 'Untitled Reminder',
            description: activity.description,
            datetime: activity.payload?.reminderTime || activity.createdAt,
            isActive: activity.status !== 'completed',
            repeat: activity.payload?.repeat || 'none',
            type: activity.payload?.reminderType || 'notification',
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            status: activity.status,
            priority: activity.priority,
            payload: activity.payload
          }));
        
        setReminders(reminderActivities);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    const interval = setInterval(fetchReminders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleReminderStatus = async (reminderId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        fetchReminders(); // Refresh reminders
      }
    } catch (error) {
      console.error('Failed to update reminder:', error);
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

  const getStatusIcon = (isActive: boolean, status?: string) => {
    if (status === 'completed' || !isActive) return <Circle className="w-4 h-4 text-gray-400" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'active') return reminder.isActive && reminder.status !== 'completed';
    if (filter === 'completed') return !reminder.isActive || reminder.status === 'completed';
    return true;
  });

  const upcomingReminders = filteredReminders.filter(r => 
    new Date(r.datetime) > new Date() && r.isActive
  ).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const pastReminders = filteredReminders.filter(r => 
    new Date(r.datetime) <= new Date() || !r.isActive
  ).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
                <h1 className="text-3xl font-bold text-foreground">Reminders</h1>
                <p className="text-muted-foreground">Real-time reminder management with priority and completion tracking</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({reminders.length})
                </Button>
                <Button 
                  variant={filter === 'active' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('active')}
                >
                  Active ({reminders.filter(r => r.isActive && r.status !== 'completed').length})
                </Button>
                <Button 
                  variant={filter === 'completed' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed ({reminders.filter(r => !r.isActive || r.status === 'completed').length})
                </Button>
              </div>
            </div>

            {/* Upcoming Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  Upcoming Reminders ({upcomingReminders.length})
                </CardTitle>
                <CardDescription>
                  Reminders scheduled for the future
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingReminders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No upcoming reminders
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <button
                          onClick={() => toggleReminderStatus(reminder.id, reminder.isActive)}
                          className="mt-1 flex-shrink-0"
                        >
                          {getStatusIcon(reminder.isActive, reminder.status)}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{reminder.title}</h4>
                            {reminder.priority && (
                              <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                                {reminder.priority}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {reminder.type}
                            </Badge>
                            {reminder.repeat !== 'none' && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                {reminder.repeat}
                              </Badge>
                            )}
                          </div>
                          
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {reminder.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(reminder.datetime).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created {new Date(reminder.createdAt).toLocaleDateString()}
                            </span>
                            {reminder.payload?.executionResult?.messageId && (
                              <span className="text-green-600">
                                ✓ Added to Calendar
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

            {/* Past/Completed Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Past & Completed Reminders ({pastReminders.length})
                </CardTitle>
                <CardDescription>
                  Previously completed or deactivated reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pastReminders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No past reminders
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pastReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card opacity-75"
                      >
                        <div className="mt-1 flex-shrink-0">
                          {getStatusIcon(reminder.isActive, reminder.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium truncate ${
                              !reminder.isActive || reminder.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {reminder.title}
                            </h4>
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                              {reminder.type}
                            </Badge>
                            {!reminder.isActive && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(reminder.datetime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created {new Date(reminder.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
                                              
