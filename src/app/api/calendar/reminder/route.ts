import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ReminderService } from "@/lib/services/reminder-service"
import { z } from "zod"

const createReminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string().min(1),
  syncToCalendar: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const accessToken = (session as any).accessToken
    const body = await request.json()
    const validated = createReminderSchema.parse(body)

    const reminder = await ReminderService.createReminder({
      userId: session.user.id,
      ...validated,
      accessToken: validated.syncToCalendar ? accessToken : undefined
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create reminder" }, { status: 500 })
  }
}
