import { create } from "zustand"
import { AIAssistantMessage, AIIntent } from "@/types"

interface AIState {
  messages: AIAssistantMessage[]
  isProcessing: boolean
  lastIntent: AIIntent | null
  addMessage: (message: AIAssistantMessage) => void
  setProcessing: (processing: boolean) => void
  setLastIntent: (intent: AIIntent | null) => void
  clearMessages: () => void
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isProcessing: false,
  lastIntent: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setProcessing: (processing) => set({ isProcessing: processing }),

  setLastIntent: (intent) => set({ lastIntent: intent }),

  clearMessages: () => set({ messages: [], lastIntent: null }),
}))
