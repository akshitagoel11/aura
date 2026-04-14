import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { aiService } from "@/lib/services/ai-service"
import { syncTaskToGoogle } from "@/lib/services/google-services"
import { TaskCategory, Priority } from "@/types"

/**
 * Accept both ISO 8601 ("2024-01-15T09:00:00.000Z") and datetime-local
 * ("2024-01-15T09:00") formats. Returns a valid Date or throws.
 */
const flexibleDateString = z.string().refine(
  (val) => {
    const d = new Date(val)
    return !isNaN(d.getTime())
  },
  { message: "Invalid date string" }
)

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  category: z.nativeEnum(TaskCategory).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: flexibleDateString.optional().nullable(),
  estimatedDuration: z.number().int().positive().optional(),
  useAI: z.boolean().optional(),
  assigneeEmail: z.string().email().optional().nullable(),
  // Support comma-separated multiple emails
  assigneeEmails: z.array(z.string().email()).optional(),
  syncToGoogleTasks: z.boolean().optional(),
  syncToGoogleCalendar: z.boolean().optional(),
  sendEmailNotification: z.boolean().optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(TaskCategory).optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  dueDate: flexibleDateString.optional().nullable(),
  estimatedDuration: z.number().int().positive().optional().nullable(),
  actualDuration: z.number().int().positive().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const priority = searchParams.get("priority")
    const overdue = searchParams.get("overdue")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    const where: any = { userId: session.user.id }

    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority
    if (overdue === "true") {
      where.dueDate = { lt: new Date() }
      where.status = { not: "COMPLETED" }
    }

    const skip = (page - 1) * limit

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    let category = validatedData.category
    let estimatedDuration = validatedData.estimatedDuration

    if (validatedData.useAI !== false) {
      try {
        const aiResult = await aiService.autoCategorizeTask(
          validatedData.title,
          validatedData.description
        )
        category = (aiResult.category as TaskCategory) || category || "OTHER"
        estimatedDuration = aiResult.estimatedDuration || estimatedDuration
      } catch (error) {
        console.error("AI categorization failed:", error)
      }
    }

    // Combine single email and array of emails
    const allEmails: string[] = []
    if (validatedData.assigneeEmail) {
      allEmails.push(validatedData.assigneeEmail)
    }
    if (validatedData.assigneeEmails) {
      allEmails.push(...validatedData.assigneeEmails)
    }
    const primaryEmail = allEmails[0] || null

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: category || "OTHER",
        priority: validatedData.priority || "MEDIUM",
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedDuration,
        aiGenerated: validatedData.useAI !== false,
        assigneeEmail: primaryEmail,
      },
    })

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "TASK",
        title: `Created task: ${task.title}`,
        metadata: JSON.stringify({ taskId: task.id }),
        startedAt: new Date(),
      },
    })

    // ─── Google Integrations ──────────────────────────────────────────────
    // Sync to Google Tasks, Calendar, and send email notifications.
    // Uses the OAuth access token from the session.
    // Failures are logged but don't block the response.
    const accessToken = (session as any).accessToken
    const tokenError = (session as any).tokenError
    let googleSync = null

    if (tokenError) {
      console.warn("[Tasks API] Token error detected:", tokenError, "— skipping Google sync")
    } else if (accessToken) {
      try {
        googleSync = await syncTaskToGoogle({
          accessToken,
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            assigneeEmail: primaryEmail,
            assigneeEmails: allEmails.length > 1 ? allEmails : undefined,
          },
          senderName: session.user.name || "Aura AI User",
          senderEmail: session.user.email || "",
          syncToTasks: validatedData.syncToGoogleTasks !== false,
          syncToCalendar: validatedData.syncToGoogleCalendar !== false,
          sendEmail: validatedData.sendEmailNotification !== false,
        })

        // Update task with Google sync IDs
        if (googleSync.googleTaskId || googleSync.googleCalendarId || (googleSync.notifiedEmails && googleSync.notifiedEmails.length > 0)) {
          await prisma.task.update({
            where: { id: task.id },
            data: {
              googleTaskId: googleSync.googleTaskId,
              googleCalendarId: googleSync.googleCalendarId,
              notifiedEmails: googleSync.notifiedEmails?.length
                ? JSON.stringify(googleSync.notifiedEmails)
                : null,
            },
          })
        }
      } catch (error) {
        console.error("[Tasks API] Google sync failed (non-blocking):", error)
      }
    } else {
      console.log("[Tasks API] No access token — skipping Google sync (user may be using credentials login)")
    }

    return NextResponse.json(
      {
        ...task,
        googleSync: googleSync
          ? {
              googleTaskSynced: !!googleSync.googleTaskId,
              googleCalendarSynced: !!googleSync.googleCalendarId,
              emailsSent: googleSync.notifiedEmails || [],
              errors: googleSync.errors,
            }
          : null,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("id")

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const updateData: any = { ...validatedData }
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : null
    }

    if (validatedData.status === "COMPLETED" && !existingTask.completedAt) {
      updateData.completedAt = new Date()
    } else if (validatedData.status !== "COMPLETED") {
      updateData.completedAt = null
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    if (validatedData.status === "COMPLETED") {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          type: "TASK",
          title: `Completed task: ${task.title}`,
          metadata: JSON.stringify({ taskId: task.id }),
          startedAt: new Date(),
        },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("id")

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await prisma.task.delete({ where: { id: taskId } })

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "TASK",
        title: `Deleted task: ${existingTask.title}`,
        metadata: JSON.stringify({ taskId }),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
