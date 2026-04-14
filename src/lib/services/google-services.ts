/**
 * Google Services Layer
 * Handles Gmail notifications, Google Tasks sync, and Google Calendar reminders.
 * All API calls use raw fetch() with OAuth access tokens — no extra dependencies.
 */

// ─── Retry Helper ───────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  delay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options)
    if (response.ok || attempt === retries) {
      return response
    }
    // Only retry on 5xx errors or rate limiting (429)
    if (response.status >= 500 || response.status === 429) {
      console.warn(`[GoogleServices] Attempt ${attempt + 1} failed (${response.status}), retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // exponential backoff
    } else {
      return response // 4xx errors are not retryable
    }
  }
  throw new Error("fetchWithRetry: should not reach here")
}

// ─── Gmail Service ─────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string
  subject: string
  body: string
  htmlBody?: string
}

export class GmailService {
  private static readonly BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me"

  /**
   * Send an email notification via the Gmail API.
   * Constructs an RFC 2822 message and base64url-encodes it.
   */
  static async sendNotification(
    accessToken: string,
    payload: EmailPayload
  ): Promise<{ id: string; threadId: string } | null> {
    try {
      const emailContent = this.buildRawEmail(payload)
      const encodedMessage = this.base64UrlEncode(emailContent)

      const response = await fetchWithRetry(`${this.BASE_URL}/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[GmailService] Failed to send email:", response.status, error)
        return null
      }

      const result = await response.json()
      console.log("[GmailService] Email sent successfully:", result.id)
      return { id: result.id, threadId: result.threadId }
    } catch (error) {
      console.error("[GmailService] Error sending email:", error)
      return null
    }
  }

  /**
   * Build a task notification email with beautiful HTML styling
   */
  static buildTaskNotificationEmail(params: {
    taskTitle: string
    taskDescription?: string
    taskPriority: string
    dueDate?: string
    senderName: string
    senderEmail: string
    appUrl?: string
  }): EmailPayload {
    const priorityColors: Record<string, string> = {
      LOW: "#22c55e",
      MEDIUM: "#f59e0b",
      HIGH: "#f97316",
      URGENT: "#ef4444",
    }
    const priorityEmoji: Record<string, string> = {
      LOW: "🟢",
      MEDIUM: "🟡",
      HIGH: "🟠",
      URGENT: "🔴",
    }
    const priorityColor = priorityColors[params.taskPriority] || "#6366f1"
    const emoji = priorityEmoji[params.taskPriority] || "📋"
    const dueDateStr = params.dueDate
      ? new Date(params.dueDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "No due date set"
    const appUrl = params.appUrl || process.env.APP_URL || "http://localhost:3000"

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:20px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);padding:40px 32px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
        <span style="font-size:24px;">✨</span>
      </div>
      <h1 style="color:white;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Aura AI</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">New Task Assignment</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#e2e8f0;">${params.senderName}</strong>
        <span style="color:#64748b;font-size:12px;">(${params.senderEmail})</span>
        has assigned you a new task:
      </p>

      <!-- Task Card -->
      <div style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:24px;">
        <h2 style="margin:0 0 12px;font-size:20px;color:#f1f5f9;font-weight:700;">${emoji} ${params.taskTitle}</h2>
        ${params.taskDescription ? `<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">${params.taskDescription}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;">
              <span style="display:inline-block;background:${priorityColor}20;color:${priorityColor};border:1px solid ${priorityColor}40;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                ${params.taskPriority} Priority
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <span style="display:inline-block;background:#1e293b;color:#94a3b8;border:1px solid #334155;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:500;">
                📅 ${dueDateStr}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
          View in Aura AI →
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #334155;padding-top:20px;margin-top:16px;">
        <p style="color:#475569;font-size:11px;text-align:center;margin:0;line-height:1.6;">
          Sent via <strong style="color:#6366f1;">Aura AI</strong> Productivity Platform<br>
          <span style="color:#334155;">You're receiving this because someone assigned you a task.</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    return {
      to: "", // caller will set this
      subject: `${emoji} New Task Assigned: ${params.taskTitle}`,
      body: `${params.senderName} assigned you a task: ${params.taskTitle}. Priority: ${params.taskPriority}. Due: ${dueDateStr}`,
      htmlBody,
    }
  }

  /**
   * Build a task update notification email
   */
  static buildTaskUpdateEmail(params: {
    taskTitle: string
    updateType: "completed" | "updated" | "reminder"
    taskPriority: string
    dueDate?: string
    senderName: string
  }): EmailPayload {
    const updateMessages: Record<string, { subject: string; heading: string; emoji: string }> = {
      completed: { subject: "✅ Task Completed", heading: "Task Completed!", emoji: "🎉" },
      updated: { subject: "📝 Task Updated", heading: "Task Updated", emoji: "📝" },
      reminder: { subject: "⏰ Task Reminder", heading: "Reminder", emoji: "⏰" },
    }
    const msg = updateMessages[params.updateType] || updateMessages.updated

    return {
      to: "",
      subject: `${msg.subject}: ${params.taskTitle}`,
      body: `${msg.emoji} ${msg.heading}: "${params.taskTitle}" by ${params.senderName}. Priority: ${params.taskPriority}.`,
    }
  }

  private static buildRawEmail(payload: EmailPayload): string {
    const boundary = "boundary_" + Date.now()
    const lines = [
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      "",
      payload.body,
      "",
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      "",
      payload.htmlBody || payload.body,
      "",
      `--${boundary}--`,
    ]
    return lines.join("\r\n")
  }

  private static base64UrlEncode(str: string): string {
    const encoded = Buffer.from(str, "utf-8").toString("base64")
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  }
}

// ─── Google Tasks Service ───────────────────────────────────────────────────────

export interface GoogleTaskPayload {
  title: string
  notes?: string
  due?: string // RFC 3339 date string
}

export interface GoogleTaskResponse {
  id: string
  title: string
  status: string
  due?: string
  selfLink: string
}

export class GoogleTasksService {
  private static readonly BASE_URL = "https://tasks.googleapis.com/tasks/v1"

  /**
   * Create a task in the user's default Google Tasks list.
   */
  static async createTask(
    accessToken: string,
    payload: GoogleTaskPayload
  ): Promise<GoogleTaskResponse | null> {
    try {
      const body: Record<string, any> = {
        title: payload.title,
        notes: payload.notes || "",
        status: "needsAction",
      }

      if (payload.due) {
        // Google Tasks API expects RFC 3339 date
        body.due = new Date(payload.due).toISOString()
      }

      const response = await fetchWithRetry(`${this.BASE_URL}/lists/@default/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[GoogleTasksService] Failed to create task:", response.status, error)
        return null
      }

      const result = await response.json()
      console.log("[GoogleTasksService] Task created:", result.id)
      return {
        id: result.id,
        title: result.title,
        status: result.status,
        due: result.due,
        selfLink: result.selfLink,
      }
    } catch (error) {
      console.error("[GoogleTasksService] Error creating task:", error)
      return null
    }
  }

  /**
   * List all task lists for the user.
   */
  static async getTaskLists(
    accessToken: string
  ): Promise<Array<{ id: string; title: string }>> {
    try {
      const response = await fetch(`${this.BASE_URL}/users/@me/lists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.error("[GoogleTasksService] Failed to list task lists:", response.status)
        return []
      }

      const result = await response.json()
      return (result.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
      }))
    } catch (error) {
      console.error("[GoogleTasksService] Error listing task lists:", error)
      return []
    }
  }
}

// ─── Google Calendar Service ────────────────────────────────────────────────────

export interface CalendarEventPayload {
  summary: string
  description?: string
  startTime: string // ISO date string
  endTime?: string // ISO date string (defaults to startTime + 1 hour)
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{
      method: "email" | "popup"
      minutes: number
    }>
  }
  attendees?: Array<{ email: string }>
}

export interface CalendarEventResponse {
  id: string
  htmlLink: string
  summary: string
  start: { dateTime: string }
  end: { dateTime: string }
}

export class GoogleCalendarService {
  private static readonly BASE_URL = "https://www.googleapis.com/calendar/v3"

  /**
   * Create a calendar event with reminders on the user's primary calendar.
   */
  static async createEvent(
    accessToken: string,
    payload: CalendarEventPayload
  ): Promise<CalendarEventResponse | null> {
    try {
      const startTime = new Date(payload.startTime)
      const endTime = payload.endTime
        ? new Date(payload.endTime)
        : new Date(startTime.getTime() + 60 * 60 * 1000) // default 1 hour

      const body: Record<string, any> = {
        summary: payload.summary,
        description: payload.description || "",
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
        reminders: payload.reminders || {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 10 },
            { method: "popup", minutes: 30 },
            { method: "email", minutes: 60 },
          ],
        },
        // Color: Grape (purple) for Aura AI tasks
        colorId: "3",
      }

      if (payload.attendees && payload.attendees.length > 0) {
        body.attendees = payload.attendees
        body.guestsCanModify = false
        body.guestsCanSeeOtherGuests = true
      }

      const response = await fetchWithRetry(
        `${this.BASE_URL}/calendars/primary/events?sendUpdates=all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error("[GoogleCalendarService] Failed to create event:", response.status, error)
        return null
      }

      const result = await response.json()
      console.log("[GoogleCalendarService] Event created:", result.id)
      return {
        id: result.id,
        htmlLink: result.htmlLink,
        summary: result.summary,
        start: result.start,
        end: result.end,
      }
    } catch (error) {
      console.error("[GoogleCalendarService] Error creating event:", error)
      return null
    }
  }
}

// ─── Helper: Extract Email Addresses ────────────────────────────────────────────

/**
 * Extract email addresses from a string (task title/description).
 */
export function extractEmailAddresses(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  return Array.from(new Set(text.match(emailRegex) || []))
}

// ─── Unified Google Sync Helper ─────────────────────────────────────────────────

export interface GoogleSyncResult {
  googleTaskId?: string | null
  googleCalendarId?: string | null
  notifiedEmails?: string[]
  errors: string[]
}

/**
 * Perform all three Google syncs for a newly created task.
 * Failures are logged but don't block task creation.
 */
export async function syncTaskToGoogle(params: {
  accessToken: string
  task: {
    id: string
    title: string
    description?: string | null
    priority: string
    dueDate?: Date | string | null
    assigneeEmail?: string | null
    assigneeEmails?: string[]
  }
  senderName: string
  senderEmail: string
  syncToTasks?: boolean
  syncToCalendar?: boolean
  sendEmail?: boolean
}): Promise<GoogleSyncResult> {
  const result: GoogleSyncResult = {
    googleTaskId: null,
    googleCalendarId: null,
    notifiedEmails: [],
    errors: [],
  }

  const { accessToken, task, senderName, senderEmail } = params
  const syncToTasks = params.syncToTasks !== false
  const syncToCalendar = params.syncToCalendar !== false
  const sendEmail = params.sendEmail !== false

  // 1. Sync to Google Tasks
  if (syncToTasks) {
    try {
      const googleTask = await GoogleTasksService.createTask(accessToken, {
        title: task.title,
        notes: task.description || undefined,
        due: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
      })
      if (googleTask) {
        result.googleTaskId = googleTask.id
      } else {
        result.errors.push("Google Tasks: failed to create task")
      }
    } catch (error) {
      console.error("[syncTaskToGoogle] Tasks sync failed:", error)
      result.errors.push("Failed to sync to Google Tasks")
    }
  }

  // 2. Create Google Calendar event with reminder
  if (syncToCalendar && task.dueDate) {
    try {
      // Collect all attendee emails
      const attendees: Array<{ email: string }> = []
      if (task.assigneeEmail) {
        attendees.push({ email: task.assigneeEmail })
      }
      if (task.assigneeEmails) {
        for (const email of task.assigneeEmails) {
          if (!attendees.find((a) => a.email === email)) {
            attendees.push({ email })
          }
        }
      }

      const calendarEvent = await GoogleCalendarService.createEvent(accessToken, {
        summary: `📋 ${task.title}`,
        description: `Task: ${task.title}\nPriority: ${task.priority}\n${task.description || ""}\n\n— Created by Aura AI`,
        startTime: new Date(task.dueDate).toISOString(),
        attendees: attendees.length > 0 ? attendees : undefined,
      })
      if (calendarEvent) {
        result.googleCalendarId = calendarEvent.id
      } else {
        result.errors.push("Google Calendar: failed to create event")
      }
    } catch (error) {
      console.error("[syncTaskToGoogle] Calendar sync failed:", error)
      result.errors.push("Failed to create Google Calendar event")
    }
  }

  // 3. Send email notifications
  if (sendEmail) {
    const emailTargets: string[] = []

    // Add explicit assignee(s)
    if (task.assigneeEmail) {
      emailTargets.push(task.assigneeEmail)
    }
    if (task.assigneeEmails) {
      emailTargets.push(...task.assigneeEmails)
    }

    // Extract emails from title/description
    const textToScan = [task.title, task.description || ""].join(" ")
    const extractedEmails = extractEmailAddresses(textToScan)
    emailTargets.push(...extractedEmails)

    // Deduplicate and exclude sender
    const uniqueTargets = Array.from(new Set(emailTargets))
      .filter((email) => email.toLowerCase() !== senderEmail.toLowerCase())

    for (const recipientEmail of uniqueTargets) {
      try {
        const emailPayload = GmailService.buildTaskNotificationEmail({
          taskTitle: task.title,
          taskDescription: task.description || undefined,
          taskPriority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          senderName,
          senderEmail,
        })
        emailPayload.to = recipientEmail

        const sent = await GmailService.sendNotification(accessToken, emailPayload)
        if (sent) {
          result.notifiedEmails!.push(recipientEmail)
        } else {
          result.errors.push(`Gmail: failed to notify ${recipientEmail}`)
        }
      } catch (error) {
        console.error(`[syncTaskToGoogle] Email to ${recipientEmail} failed:`, error)
        result.errors.push(`Failed to email ${recipientEmail}`)
      }
    }
  }

  return result
}
