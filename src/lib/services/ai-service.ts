import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { AIIntent, AIAction } from "@/types"

export class AIService {
  private openai: OpenAI | null = null
  private gemini: GoogleGenerativeAI | null = null
  private primaryProvider: "openai" | "gemini"

  constructor() {
    // Find available providers
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const hasGemini = !!process.env.GOOGLE_GEMINI_API_KEY

    // Set primary provider based on availability
    if (process.env.AI_PROVIDER === "gemini" && hasGemini) {
      this.primaryProvider = "gemini"
    } else if (process.env.AI_PROVIDER === "openai" && hasOpenAI) {
      this.primaryProvider = "openai"
    } else {
      // Auto-detect
      this.primaryProvider = hasGemini ? "gemini" : "openai"
    }

    console.log(`[AIService] Selected Provider: ${this.primaryProvider} (Gemini: ${hasGemini}, OpenAI: ${hasOpenAI})`)

    if (hasOpenAI) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }

    if (hasGemini) {
      this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
    }
  }

  async parseIntent(input: string, context?: Record<string, any>): Promise<AIIntent> {
    const provider = this.primaryProvider
    const hasOpenAI = !!this.openai
    const hasGemini = !!this.gemini

    try {
      if (provider === "openai" && hasOpenAI) {
        return await this.parseWithOpenAI(input, context)
      } 
      
      if (hasGemini) {
        return await this.parseWithGemini(input, context)
      } 
      
      if (hasOpenAI) {
        return await this.parseWithOpenAI(input, context)
      }
      
      throw new Error(`No AI providers configured. Please check GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY in environment variables.`)
    } catch (error: any) {
      console.error(`[AIService] ${provider} failed, trying fallback:`, error.message)

      // Fallback logic
      if (provider === "openai" && hasGemini) {
        try { return await this.parseWithGemini(input, context) } catch (e) {}
      } else if (hasOpenAI) {
        try { return await this.parseWithOpenAI(input, context) } catch (e) {}
      }

      console.warn("[AIService] All AI providers failed, falling back to local heuristic parsing")
      return this.parseLocally(input)
    }
  }

  private parseLocally(input: string): AIIntent {
    const lowerInput = input.toLowerCase()
    const intent: AIIntent = {
      intent: "GENERAL_CHAT",
      confidence: 0.5,
      parameters: { message: input },
      actions: [],
      rawResponse: "Local fallback parsing used",
    }

    if (lowerInput.match(/create|add|new|make/) && (lowerInput.includes("task") || lowerInput.includes("todo"))) {
      intent.intent = "CREATE_TASK"
      const title = input.replace(/create|add|new|make|task|a|todo/gi, "").trim()
      intent.parameters.title = title || "New Task"
      intent.parameters.priority = lowerInput.includes("urgent") ? "URGENT" : lowerInput.includes("high") ? "HIGH" : "MEDIUM"
    } else if (lowerInput.includes("schedule") || lowerInput.includes("plan")) {
      intent.intent = "CREATE_SCHEDULE"
      intent.parameters.date = lowerInput.includes("tomorrow") ? "tomorrow" : "today"
    } else if (lowerInput.includes("focus") || lowerInput.includes("work")) {
      intent.intent = "START_FOCUS"
    } else if (lowerInput.includes("break") || lowerInput.includes("rest")) {
      intent.intent = "START_BREAK"
    } else if (lowerInput.includes("analytics") || lowerInput.includes("stat") || lowerInput.includes("how am i doing")) {
      intent.intent = "QUERY_ANALYTICS"
    }

    intent.actions = this.generateDefaultActions(intent, input)
    return intent
  }

  private async parseWithOpenAI(input: string, context?: Record<string, any>): Promise<AIIntent> {
    if (!this.openai) {
      throw new Error("OpenAI not configured")
    }

    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(input, context)

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("Empty response from OpenAI")
    }

    return this.parseAIResponse(content, input)
  }

  private async parseWithGemini(input: string, context?: Record<string, any>): Promise<AIIntent> {
    if (!this.gemini) {
      throw new Error("Gemini not configured")
    }

    const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(input, context)

    console.log("[AIService] Calling Gemini (gemini-2.0-flash)...")
    console.log(`[AIService] User input: ${input}`)

    try {
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      })

      const content = result.response.text()
      console.log(`[AIService] Gemini response received: ${content.substring(0, 100)}...`)

      if (!content) {
        throw new Error("Empty response from Gemini")
      }

      return this.parseAIResponse(content, input)
    } catch (error) {
      console.error("[AIService] Gemini generateContent failed:", error)
      throw error
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI productivity assistant that parses user intents and converts them into structured actions.

Available intents:
- CREATE_TASK: Create a new task
- UPDATE_TASK: Update an existing task
- DELETE_TASK: Delete a task
- CREATE_SCHEDULE: Create a schedule/plan
- START_FOCUS: Start a focus session
- START_BREAK: Start a break
- LOG_ACTIVITY: Log an activity
- QUERY_TASKS: Query or search tasks
- QUERY_ANALYTICS: Ask about productivity metrics
- SEND_EMAIL: Send an email to someone
- CREATE_REMINDER: Create a reminder or calendar event
- GENERAL_CHAT: General conversation

For each intent, extract relevant parameters and suggest actions.

Respond ONLY with a JSON object in this format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.0-1.0,
  "parameters": {
    "title": "task title or reminder title",
    "description": "task description or reminder details",
    "category": "WORK|PERSONAL|LEARNING|HEALTH|FINANCE|MEETING|CREATIVE|OTHER",
    "priority": "LOW|MEDIUM|HIGH|URGENT",
    "dueDate": "ISO date string or relative time",
    "scheduledAt": "ISO date for reminder/email",
    "duration": "estimated duration in minutes",
    "taskId": "task identifier if updating/deleting",
    "to": "email address of recipient",
    "subject": "email subject",
    "body": "email body/content"
  },
  "actions": [
    {
      "type": "ACTION_TYPE",
      "description": "human readable description",
      "data": { }
    }
  ]
}`
  }

  private buildUserPrompt(input: string, context?: Record<string, any>): string {
    let prompt = `Parse this user input: "${input}"`

    if (context) {
      prompt += `\n\nContext: ${JSON.stringify(context)}`
    }

    const now = new Date()
    prompt += `\n\nCurrent time: ${now.toISOString()}`
    prompt += `\nToday's date: ${now.toDateString()}`

    return prompt
  }

  private parseAIResponse(content: string, originalInput: string): AIIntent {
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleaned)

      const intent: AIIntent = {
        intent: parsed.intent || "GENERAL_CHAT",
        confidence: parsed.confidence || 0.5,
        parameters: parsed.parameters || {},
        actions: parsed.actions || [],
        rawResponse: content,
      }

      if (intent.actions.length === 0) {
        intent.actions = this.generateDefaultActions(intent, originalInput)
      }

      return intent
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      return {
        intent: "GENERAL_CHAT",
        confidence: 0.3,
        parameters: { message: originalInput },
        actions: [
          {
            type: "CHAT",
            description: "I didn't understand that. Could you rephrase?",
          },
        ],
        rawResponse: content,
      }
    }
  }

  private generateDefaultActions(intent: AIIntent, input: string): AIAction[] {
    switch (intent.intent) {
      case "CREATE_TASK":
        return [
          {
            type: "CREATE_TASK",
            description: `Create task: ${intent.parameters.title || input}`,
            data: intent.parameters,
          },
        ]
      case "SEND_EMAIL":
        return [
          {
            type: "SEND_EMAIL",
            description: `Send email to: ${intent.parameters.to || "someone"}`,
            data: intent.parameters,
          },
        ]
      case "CREATE_REMINDER":
        return [
          {
            type: "CREATE_REMINDER",
            description: `Create reminder: ${intent.parameters.title || input}`,
            data: intent.parameters,
          },
        ]
      case "UPDATE_TASK":
        return [
          {
            type: "UPDATE_TASK",
            description: `Update task: ${intent.parameters.title || intent.parameters.taskId}`,
            data: intent.parameters,
          },
        ]
      case "DELETE_TASK":
        return [
          {
            type: "DELETE_TASK",
            description: `Delete task: ${intent.parameters.title || intent.parameters.taskId}`,
            data: intent.parameters,
          },
        ]
      case "CREATE_SCHEDULE":
        return [
          {
            type: "CREATE_SCHEDULE",
            description: `Create schedule for: ${intent.parameters.date || "today"}`,
            data: intent.parameters,
          },
        ]
      case "START_FOCUS":
        return [
          {
            type: "START_FOCUS",
            description: "Start focus session",
            data: intent.parameters,
          },
        ]
      case "START_BREAK":
        return [
          {
            type: "START_BREAK",
            description: "Start break",
            data: intent.parameters,
          },
        ]
      default:
        return [
          {
            type: "CHAT",
            description: "Continue conversation",
            data: { message: input },
          },
        ]
    }
  }

  async generateSchedule(
    tasks: Array<{ title: string; priority: string; estimatedDuration?: number }>,
    preferences: {
      workingHoursStart: number
      workingHoursEnd: number
      workingDays: number[]
    },
    date: Date
  ): Promise<Array<{ title: string; startTime: string; endTime: string; type: string }>> {
    try {
      if (this.openai) {
        return await this.generateScheduleWithOpenAI(tasks, preferences, date)
      } else if (this.gemini) {
        return await this.generateScheduleWithGemini(tasks, preferences, date)
      }
      throw new Error("No AI provider available")
    } catch (error) {
      console.error("Failed to generate schedule:", error)
      return this.generateDefaultSchedule(tasks, preferences, date)
    }
  }

  private async generateScheduleWithOpenAI(
    tasks: Array<{ title: string; priority: string; estimatedDuration?: number }>,
    preferences: { workingHoursStart: number; workingHoursEnd: number; workingDays: number[] },
    date: Date
  ): Promise<Array<{ title: string; startTime: string; endTime: string; type: string }>> {
    if (!this.openai) throw new Error("OpenAI not configured")

    const prompt = `Generate an optimized daily schedule based on these tasks and preferences.

Tasks: ${JSON.stringify(tasks)}
Working hours: ${preferences.workingHoursStart}:00 - ${preferences.workingHoursEnd}:00
Date: ${date.toDateString()}

Create a schedule that:
1. Prioritizes high-priority tasks during peak productivity hours
2. Includes breaks every 90 minutes
3. Groups similar tasks together
4. Respects working hours

Respond with JSON array: [{"title": "...", "startTime": "HH:MM", "endTime": "HH:MM", "type": "TASK|BREAK|MEETING"}]`

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("Empty response")

    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim())
    return Array.isArray(parsed) ? parsed : parsed.schedule || []
  }

  private async generateScheduleWithGemini(
    tasks: Array<{ title: string; priority: string; estimatedDuration?: number }>,
    preferences: { workingHoursStart: number; workingHoursEnd: number; workingDays: number[] },
    date: Date
  ): Promise<Array<{ title: string; startTime: string; endTime: string; type: string }>> {
    if (!this.gemini) throw new Error("Gemini not configured")

    const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `Generate an optimized daily schedule based on these tasks and preferences.

Tasks: ${JSON.stringify(tasks)}
Working hours: ${preferences.workingHoursStart}:00 - ${preferences.workingHoursEnd}:00
Date: ${date.toDateString()}

Create a schedule that:
1. Prioritizes high-priority tasks during peak productivity hours
2. Includes breaks every 90 minutes
3. Groups similar tasks together
4. Respects working hours

Respond with JSON array: [{"title": "...", "startTime": "HH:MM", "endTime": "HH:MM", "type": "TASK|BREAK|MEETING"}]`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 2000 },
    })

    const content = result.response.text()
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim())
    return Array.isArray(parsed) ? parsed : parsed.schedule || []
  }

  private generateDefaultSchedule(
    tasks: Array<{ title: string; priority: string; estimatedDuration?: number }>,
    preferences: { workingHoursStart: number; workingHoursEnd: number },
    date: Date
  ): Array<{ title: string; startTime: string; endTime: string; type: string }> {
    const schedule: Array<{ title: string; startTime: string; endTime: string; type: string }> = []
    let currentHour = preferences.workingHoursStart

    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    })

    for (const task of sortedTasks) {
      if (currentHour >= preferences.workingHoursEnd) break

      const duration = task.estimatedDuration || 60
      const hours = Math.ceil(duration / 60)

      const startTime = `${currentHour.toString().padStart(2, "0")}:00`
      const endTime = `${(currentHour + hours).toString().padStart(2, "0")}:00`

      schedule.push({
        title: task.title,
        startTime,
        endTime,
        type: "TASK",
      })

      currentHour += hours

      if (currentHour < preferences.workingHoursEnd) {
        schedule.push({
          title: "Break",
          startTime: `${currentHour.toString().padStart(2, "0")}:00`,
          endTime: `${(currentHour + 0.25).toString().padStart(2, "0")}:15`,
          type: "BREAK",
        })
        currentHour += 0.25
      }
    }

    return schedule
  }

  async autoCategorizeTask(title: string, description?: string): Promise<{ category: string; estimatedDuration: number }> {
    const prompt = `Categorize this task and estimate duration:
Title: ${title}
Description: ${description || "N/A"}

Respond with JSON: {"category": "WORK|PERSONAL|LEARNING|HEALTH|FINANCE|MEETING|CREATIVE|OTHER", "estimatedDuration": number (minutes)}`

    try {
      if (this.primaryProvider === "openai" && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 200,
          response_format: { type: "json_object" },
        })
        const content = response.choices[0]?.message?.content
        if (content) return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim())
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" })
        const result = await model.generateContent(prompt)
        const content = result.response.text()
        if (content) return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim())
      }
    } catch (error) {
      console.error("[AIService] Auto-categorization failed:", error)
    }

    return { category: "OTHER", estimatedDuration: 60 }
  }
}

export const aiService = new AIService()
