"use client"

import { ScheduleView } from "@/components/dashboard"

export default function SchedulePage() {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-optimized daily schedule.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-5xl mx-auto h-full">
          <ScheduleView />
        </div>
      </main>
    </>
  )
}
