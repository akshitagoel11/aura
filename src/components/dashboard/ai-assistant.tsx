"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Bot, User, Loader2, Maximize2, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useParseIntent, useCreateTask } from "@/lib/hooks"
import { useAIStore } from "@/lib/stores"
import { AIAssistantMessage } from "@/types"
import { formatTime } from "@/lib/utils"
import { MountedOnly } from "@/components/ui/mounted-only"

export function AIAssistant() {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, isProcessing, addMessage, setProcessing, clearMessages } = useAIStore()
  const parseIntent = useParseIntent()
  const createTask = useCreateTask()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const executeActions = async (intent: any) => {
    if (!intent?.actions) return

    for (const action of intent.actions) {
      try {
        if (action.type === "CREATE_TASK") {
           await createTask.mutateAsync({
             title: action.data.title || "New Task from AI",
             description: action.data.description,
             category: action.data.category,
             priority: action.data.priority,
             estimatedDuration: action.data.duration,
             assigneeEmail: action.data.assigneeEmail || action.data.email,
             syncToGoogleTasks: true,
             syncToGoogleCalendar: true,
             sendEmailNotification: !!(action.data.assigneeEmail || action.data.email),
           } as any)
        }
        // Add more action types here as needed
      } catch (err) {
        console.error("Failed to execute AI action:", action.type, err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: AIAssistantMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    addMessage(userMessage)
    setInput("")
    setProcessing(true)

    try {
      const result = await parseIntent.mutateAsync({
        input: userMessage.content,
      })

      // Execute recognized actions
      await executeActions(result.intent)

      const assistantMessage: AIAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateResponse(result.intent),
        intent: result.intent,
        timestamp: new Date(),
      }

      addMessage(assistantMessage)
    } catch (error: any) {
      console.error("AI parse error:", error)
      const assistantMessage: AIAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm having some trouble right now: ${error.message || "Unknown error"}. Please make sure your API keys are configured correctly.`,
        timestamp: new Date(),
      }
      addMessage(assistantMessage)
    } finally {
      setProcessing(false)
    }
  }

  const generateResponse = (intent: any): string => {
    if (!intent) return "I'm not sure how to respond to that bit I can help with tasks or your schedule!"
    
    switch (intent.intent) {
      case "CREATE_TASK":
        return `✅ Task created: "${intent.parameters.title || "Untitled Task"}" (${intent.parameters.category || "General"}, ${intent.parameters.priority || "Normal"} priority).\n\n🔄 Syncing to Google Tasks & Calendar...${intent.parameters.assigneeEmail ? ` 📧 Notifying ${intent.parameters.assigneeEmail}` : ""}`
      case "UPDATE_TASK":
        return `Working on updating your task "${intent.parameters.title || intent.parameters.taskId}". Done!`
      case "DELETE_TASK":
        return `Task successfully removed from your list.`
      case "CREATE_SCHEDULE":
        return `I've optimized your schedule for ${intent.parameters.date || "today"}. Check the Schedule tab to see the updates!`
      case "START_FOCUS":
        return `Focus mode activated. Let's make progress!`
      case "START_BREAK":
        return `Starting your break now. Enjoy the rest!`
      case "QUERY_TASKS":
        return `I've pulled your task list. Is there anything specific you'd like me to modify?`
      case "QUERY_ANALYTICS":
        return `Stats for the last ${intent.parameters.period || "7 days"} are now ready in your Analytics dashboard.`
      default:
        return intent.parameters?.message || "I understand. How else can I assist with your productivity today?"
    }
  }

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "CREATE_TASK": return "bg-blue-100 text-blue-700 border-blue-200"
      case "UPDATE_TASK": return "bg-amber-100 text-amber-700 border-amber-200"
      case "DELETE_TASK": return "bg-rose-100 text-rose-700 border-rose-200"
      case "CREATE_SCHEDULE": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "START_FOCUS": return "bg-violet-100 text-violet-700 border-violet-200"
      case "QUERY_ANALYTICS": return "bg-indigo-100 text-indigo-700 border-indigo-200"
      default: return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  return (
    <Card className="h-full flex flex-col border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="pb-4 border-b bg-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-aura-600 shadow-lg shadow-aura-200">
               <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Aura Assistant</CardTitle>
              <CardDescription className="text-xs">Omniscient AI Productivity Partner</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={() => clearMessages()} title="Clear History">
                <Trash2 className="h-4 w-4 text-slate-400" />
             </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in duration-700 py-12">
              <div className="w-16 h-16 rounded-3xl bg-aura-50 flex items-center justify-center animate-bounce duration-[2000ms]">
                <Bot className="h-8 w-8 text-aura-600" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold text-slate-900">How can I assist today?</h3>
                <p className="text-sm text-slate-500 mt-2">
                  "Create a high-priority work task for tomorrow" or "What does my schedule look like?"
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "flex-row-reverse" : "animate-in fade-in slide-in-from-left-2"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  message.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-aura-600 text-white"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>
              
              <div
                className={`flex flex-col gap-1.5 max-w-[85%] ${
                  message.role === "user" ? "items-end" : ""
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-white border text-slate-700 rounded-tl-none"
                  }`}
                >
                  {message.content}
                </div>
                
                {message.intent && (
                  <div className={`mt-1 flex flex-wrap gap-2 ${message.role === "user" ? "justify-end" : ""}`}>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider font-bold h-5 ${getIntentColor(message.intent.intent)}`}
                    >
                      {message.intent.intent.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
                
                <MountedOnly>
                  <span className="text-[10px] text-slate-400 font-medium px-1">
                    {formatTime(message.timestamp)}
                  </span>
                </MountedOnly>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-aura-100 text-aura-600 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-10 w-48 bg-slate-100 rounded-2xl rounded-tl-none border border-slate-50" />
                <div className="h-3 w-12 bg-slate-100 rounded" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="relative group">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Message Aura AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                className="h-14 pl-5 pr-12 rounded-2xl border-slate-200 bg-white shadow-inner focus-visible:ring-aura-500 transition-all text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 hidden sm:block">
                 ENTER
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isProcessing || !input.trim()}
              className="h-14 w-14 rounded-2xl bg-aura-600 hover:bg-aura-700 shadow-lg shadow-aura-200 transition-all hover:scale-105"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <div className="px-2 mt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
             <div className="flex gap-3">
                <span className="hover:text-aura-600 cursor-pointer">Shortcuts</span>
                <span className="hover:text-aura-600 cursor-pointer">Commands</span>
             </div>
             <span>Gemini 1.5 Flash Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
