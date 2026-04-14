import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syncTaskToGoogle } from "@/lib/services/google-services"

/**
 * GET /api/google/sync?taskId=xxx
 * Check the Google sync status of a task.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 })
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({
      taskId: task.id,
      googleTaskSynced: !!task.googleTaskId,
      googleCalendarSynced: !!task.googleCalendarId,
      emailsSent: task.notifiedEmails ? JSON.parse(task.notifiedEmails) : [],
      googleTaskId: task.googleTaskId,
      googleCalendarId: task.googleCalendarId,
    })
  } catch (error) {
    console.error("[Google Sync API] Error:", error)
    return NextResponse.json(
      { error: "Failed to check sync status" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/google/sync
 * Manually trigger a Google sync for a specific task.
 * Body: { taskId: string, syncTasks?: boolean, syncCalendar?: boolean, sendEmail?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = (session as any).accessToken
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Google access token. Please sign in with Google." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { taskId, syncTasks, syncCalendar, sendEmail } = body

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 })
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const syncResult = await syncTaskToGoogle({
      accessToken,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeEmail: task.assigneeEmail,
      },
      senderName: session.user.name || "Aura AI User",
      senderEmail: session.user.email || "",
      syncToTasks: syncTasks !== false,
      syncToCalendar: syncCalendar !== false,
      sendEmail: sendEmail !== false,
    })

    // Update task with sync results
    await prisma.task.update({
      where: { id: task.id },
      data: {
        googleTaskId: syncResult.googleTaskId || task.googleTaskId,
        googleCalendarId: syncResult.googleCalendarId || task.googleCalendarId,
        notifiedEmails: syncResult.notifiedEmails?.length
          ? JSON.stringify([
              ...(task.notifiedEmails ? JSON.parse(task.notifiedEmails) : []),
              ...syncResult.notifiedEmails,
            ])
          : task.notifiedEmails,
      },
    })

    return NextResponse.json({
      success: true,
      googleTaskSynced: !!syncResult.googleTaskId,
      googleCalendarSynced: !!syncResult.googleCalendarId,
      emailsSent: syncResult.notifiedEmails || [],
      errors: syncResult.errors,
    })
  } catch (error) {
    console.error("[Google Sync API] Error:", error)
    return NextResponse.json(
      { error: "Failed to sync with Google" },
      { status: 500 }
    )
  }
}
