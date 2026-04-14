"use client"

import { AIAssistant } from "@/components/dashboard"

export default function AIPage() {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Interact with your intelligent productivity partner.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-4xl mx-auto h-full min-h-[500px]">
          <AIAssistant />
        </div>
      </main>
    </>
  )
}
