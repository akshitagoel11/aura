import { prisma } from "@/lib/prisma"
import { TaskStatus, Priority } from "@prisma/client"
import { GoogleTasksService, syncTaskToGoogle } from "./google-services"

export class TaskService {
  /**
   * List tasks for a specific user with optional filters
   */
  static async listTasks(userId: string, filters: { status?: string; priority?: string } = {}) {
    return await prisma.task.findMany({
      where: {
        userId,
        ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
        ...(filters.priority && filters.priority !== "ALL" ? { priority: filters.priority } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Create a new task and optionally sync to Google
   */
  static async createTask(params: {
    userId: string
    title: string
    description?: string
    priority?: string
    status?: string
    dueDate?: string
    accessToken?: string // Optional Google OAuth token
  }) {
    // 1. Save to DB
    const task = await prisma.task.create({
      data: {
        userId: params.userId,
        title: params.title,
        description: params.description,
        priority: params.priority || "MEDIUM",
        status: params.status || "TODO",
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
      },
    })

    // 2. Sync to Google if token is provided
    if (params.accessToken) {
      const syncResult = await syncTaskToGoogle({
        accessToken: params.accessToken,
        task: {
          ...task,
          dueDate: task.dueDate?.toISOString(),
        },
        senderName: "Aura AI",
        senderEmail: params.userId, // Using email as ID
        syncToTasks: true,
        syncToCalendar: true,
        sendEmail: false,
      })

      // Update task with Google IDs
      if (syncResult.googleTaskId || syncResult.googleCalendarId) {
        return await prisma.task.update({
          where: { id: task.id },
          data: {
            googleTaskId: syncResult.googleTaskId,
            googleCalendarId: syncResult.googleCalendarId,
          },
        })
      }
    }

    return task
  }

  /**
   * Update an existing task
   */
  static async updateTask(taskId: string, userId: string, data: any) {
    // Verify ownership
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!existing || existing.userId !== userId) {
      throw new Error("Unauthorized or task not found")
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: data.status === "COMPLETED" ? new Date() : undefined,
      },
    })
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string, userId: string) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!existing || existing.userId !== userId) {
      throw new Error("Unauthorized or task not found")
    }

    return await prisma.task.delete({
      where: { id: taskId },
    })
  }
}
