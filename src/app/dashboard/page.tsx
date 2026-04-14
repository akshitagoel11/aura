"use client"

import { useState } from "react"
import { TaskList, AIAssistant, AnalyticsDashboard, ActivityTimeline, ScheduleView, CreateTaskDialog } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function DashboardPage() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's your productivity overview.
          </p>
        </div>
        <Button onClick={() => setCreateTaskOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TaskList onCreateTask={() => setCreateTaskOpen(true)} />
          </div>
          <div>
            <AIAssistant />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <AnalyticsDashboard />
          </div>
          <div>
            <ActivityTimeline />
          </div>
          <div>
            <ScheduleView />
          </div>
        </div>
      </main>

      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
    </>
  )
}
