'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import RealTimeActivity from '@/components/real-time-activity';
import { Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ActivityPage() {
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
                <p className="text-muted-foreground">Real-time tracking of all your AI interactions and task executions</p>
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
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <RealTimeActivity />
          </div>
        </main>
      </div>
    </div>
  );
}
