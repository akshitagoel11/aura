import { prisma } from "@/lib/prisma"
import { GoogleCalendarService } from "./google-services"
import * as chrono from "chrono-node"

export class ReminderService {
  /**
   * Create a reminder (and sync to Google Calendar)
   */
  static async createReminder(params: {
    userId: string
    title: string
    description?: string
    scheduledAt: string // Natural language date
    accessToken?: string
  }) {
    const scheduledDate = chrono.parseDate(params.scheduledAt)
    if (!scheduledDate) throw new Error("Invalid date format")

    // 1. Save to DB
    const reminder = await prisma.reminder.create({
      data: {
        userId: params.userId,
        title: params.title,
        description: params.description,
        scheduledAt: scheduledDate,
        status: "UPCOMING",
      },
    })

    // 2. Sync to Google Calendar as an event
    if (params.accessToken) {
      await GoogleCalendarService.createEvent(params.accessToken, {
        summary: `⏰ Reminder: ${params.title}`,
        description: params.description || "Aura AI Reminder",
        startTime: scheduledDate.toISOString(),
      })
    }

    return reminder
  }

  /**
   * List reminders
   */
  static async listReminders(userId: string) {
    const now = new Date()
    
    // Auto-update missed reminders
    await prisma.reminder.updateMany({
      where: {
        userId,
        status: "UPCOMING",
        scheduledAt: { lt: now },
      },
      data: { status: "MISSED" },
    })

    return await prisma.reminder.findMany({
      where: { userId },
      orderBy: { scheduledAt: "asc" },
    })
  }

  /**
   * Complete a reminder
   */
  static async completeReminder(reminderId: string, userId: string) {
    return await prisma.reminder.update({
      where: { id: reminderId, userId },
      data: { status: "COMPLETED" },
    })
  }
}
