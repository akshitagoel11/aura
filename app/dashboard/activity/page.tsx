'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { ActivityTimeline } from '@/components/activity-timeline';
import { Filter, Download, RefreshCw } from 'lucide-react';

export default function ActivityPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
                <h1 className="text-3xl font-bold text-foreground">Activity</h1>
                <p className="text-muted-foreground">Track all your AI interactions and task executions</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">24</div>
                  <div className="text-sm text-muted-foreground">Total Activities</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-400">18</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-400">12</div>
                  <div className="text-sm text-muted-foreground">AI Previews</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-400">6</div>
                  <div className="text-sm text-muted-foreground">Executions</div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <ActivityTimeline key={refreshKey} />

            {/* Detailed Activity Log */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl">Detailed Activity Log</CardTitle>
                <CardDescription>Comprehensive view of all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <div className="font-medium text-foreground">Email sent successfully</div>
                        <div className="text-sm text-muted-foreground">Team notification about weekly meeting</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-500/20 text-green-400">executed</Badge>
                      <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div>
                        <div className="font-medium text-foreground">AI preview generated</div>
                        <div className="text-sm text-muted-foreground">Task: "Prepare project documentation"</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400">preview</Badge>
                      <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <div>
                        <div className="font-medium text-foreground">Reminder created</div>
                        <div className="text-sm text-muted-foreground">Weekly team meeting reminder</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">pending</Badge>
                      <div className="text-xs text-muted-foreground mt-1">5 hours ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
