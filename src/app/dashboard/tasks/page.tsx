"use client"

import { useState } from "react"
import { TaskList, CreateTaskDialog } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function TasksPage() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your tasks.
          </p>
        </div>
        <Button onClick={() => setCreateTaskOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-5xl mx-auto">
          <TaskList onCreateTask={() => setCreateTaskOpen(true)} />
        </div>
      </main>

      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
    </>
  )
}
