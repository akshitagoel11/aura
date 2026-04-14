"use client"

import { AnalyticsDashboard, ActivityTimeline } from "@/components/dashboard"

export default function AnalyticsPage() {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Insights into your productivity habits.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnalyticsDashboard />
          </div>
          <div>
            <ActivityTimeline />
          </div>
        </div>
      </main>
    </>
  )
}
