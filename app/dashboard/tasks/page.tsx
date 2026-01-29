'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { Plus, Calendar, Flag } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Review project proposal',
      description: 'Review and provide feedback on the Q1 project proposal',
      status: 'pending',
      priority: 'high',
      dueDate: '2024-02-01',
      createdAt: '2024-01-29',
    },
    {
      id: 2,
      title: 'Team meeting preparation',
      description: 'Prepare agenda and materials for weekly team meeting',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-01-31',
      createdAt: '2024-01-28',
    },
    {
      id: 3,
      title: 'Update documentation',
      description: 'Update API documentation with latest changes',
      status: 'completed',
      priority: 'low',
      dueDate: '2024-02-05',
      createdAt: '2024-01-25',
    },
  ]);

  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const statusFlow = {
          'pending': 'in-progress' as const,
          'in-progress': 'completed' as const,
          'completed': 'pending' as const,
        };
        return { ...task, status: statusFlow[task.status] };
      }
      return task;
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
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
                <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
                <p className="text-muted-foreground">Manage your tasks and track progress</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">{tasks.length}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-400">
                    {tasks.filter(t => t.priority === 'high').length}
                  </div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {tasks.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
            </div>

            {/* Task List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl">All Tasks</CardTitle>
                <CardDescription>View and manage all your tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-card">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => toggleTaskStatus(task.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {task.dueDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Flag className="w-3 h-3" />
                          <span>{task.priority}</span>
                        </div>
                      </div>
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
