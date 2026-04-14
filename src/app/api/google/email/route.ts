import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GmailService } from "@/lib/services/google-services"

const sendEmailSchema = z.object({
  taskId: z.string().min(1),
  recipientEmail: z.string().email(),
  message: z.string().optional(),
})

/**
 * POST /api/google/email
 * Send a notification email to a specific person about a task.
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
    const validatedData = sendEmailSchema.parse(body)

    const task = await prisma.task.findFirst({
      where: { id: validatedData.taskId, userId: session.user.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const emailPayload = GmailService.buildTaskNotificationEmail({
      taskTitle: task.title,
      taskDescription: task.description || undefined,
      taskPriority: task.priority,
      dueDate: task.dueDate?.toISOString(),
      senderName: session.user.name || "Aura AI User",
      senderEmail: session.user.email || "",
    })
    emailPayload.to = validatedData.recipientEmail

    if (validatedData.message) {
      emailPayload.body = `${validatedData.message}\n\n${emailPayload.body}`
    }

    const result = await GmailService.sendNotification(accessToken, emailPayload)

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    // Update task's notified emails list
    const existingEmails = task.notifiedEmails
      ? JSON.parse(task.notifiedEmails)
      : []
    if (!existingEmails.includes(validatedData.recipientEmail)) {
      existingEmails.push(validatedData.recipientEmail)
      await prisma.task.update({
        where: { id: task.id },
        data: { notifiedEmails: JSON.stringify(existingEmails) },
      })
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "OTHER",
        title: `Notified ${validatedData.recipientEmail} about: ${task.title}`,
        metadata: JSON.stringify({
          taskId: task.id,
          recipientEmail: validatedData.recipientEmail,
          messageId: result.id,
        }),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      messageId: result.id,
      recipientEmail: validatedData.recipientEmail,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("[Google Email API] Error:", error)
    return NextResponse.json(
      { error: "Failed to send email notification" },
      { status: 500 }
    )
  }
}
