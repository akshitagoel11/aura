'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { Plus, Bell, Clock, Calendar } from 'lucide-react';

interface Reminder {
  id: number;
  title: string;
  description: string;
  datetime: string;
  isActive: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  type: 'email' | 'notification' | 'sms';
  createdAt: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 1,
      title: 'Weekly team meeting',
      description: 'Prepare agenda for weekly team sync',
      datetime: '2024-01-31T10:00:00',
      isActive: true,
      repeat: 'weekly',
      type: 'notification',
      createdAt: '2024-01-29',
    },
    {
      id: 2,
      title: 'Project deadline',
      description: 'Submit final project deliverables',
      datetime: '2024-02-15T17:00:00',
      isActive: true,
      repeat: 'none',
      type: 'email',
      createdAt: '2024-01-28',
    },
    {
      id: 3,
      title: 'Daily standup',
      description: 'Daily team standup meeting',
      datetime: '2024-01-30T09:00:00',
      isActive: false,
      repeat: 'daily',
      type: 'notification',
      createdAt: '2024-01-25',
    },
  ]);

  const toggleReminder = (reminderId: number) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, isActive: !reminder.isActive }
        : reminder
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500/20 text-blue-400';
      case 'sms': return 'bg-green-500/20 text-green-400';
      default: return 'bg-purple-500/20 text-purple-400';
    }
  };

  const getRepeatColor = (repeat: string) => {
    switch (repeat) {
      case 'daily': return 'bg-orange-500/20 text-orange-400';
      case 'weekly': return 'bg-indigo-500/20 text-indigo-400';
      case 'monthly': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                <p className="text-muted-foreground">Set and manage your reminders</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>

            {/* Reminder Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">{reminders.length}</div>
                  <div className="text-sm text-muted-foreground">Total Reminders</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {reminders.filter(r => r.isActive).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {reminders.filter(r => r.type === 'email').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Email</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-400">
                    {reminders.filter(r => r.repeat !== 'none').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Repeating</div>
                </CardContent>
              </Card>
            </div>

            {/* Reminder List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl">All Reminders</CardTitle>
                <CardDescription>View and manage all your reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-card">
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={() => toggleReminder(reminder.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{reminder.title}</h3>
                        <Badge variant="outline" className={getTypeColor(reminder.type)}>
                          {reminder.type}
                        </Badge>
                        <Badge variant="outline" className={getRepeatColor(reminder.repeat)}>
                          {reminder.repeat}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(reminder.datetime)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {reminder.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {reminder.isActive ? (
                        <Bell className="w-4 h-4 text-green-400" />
                      ) : (
                        <Bell className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
