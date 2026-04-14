import { useMutation } from "@tanstack/react-query"
import { AIIntent } from "@/types"

interface ParseIntentInput {
  input: string
  context?: Record<string, any>
}

interface ParseIntentResponse {
  intent: AIIntent
}

interface CategorizeResponse {
  category: string
  estimatedDuration: number
}

async function parseIntent(input: ParseIntentInput): Promise<ParseIntentResponse> {
  const response = await fetch("/api/ai/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to parse intent")
  }
  return response.json()
}

async function categorizeTask(title: string, description?: string): Promise<CategorizeResponse> {
  const response = await fetch("/api/ai/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  })
  if (!response.ok) {
    throw new Error("Failed to categorize task")
  }
  return response.json()
}

export function useParseIntent() {
  return useMutation({
    mutationFn: parseIntent,
  })
}

export function useCategorizeTask() {
  return useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) =>
      categorizeTask(title, description),
  })
}
