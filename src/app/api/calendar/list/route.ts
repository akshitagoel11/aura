import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ReminderService } from "@/lib/services/reminder-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const reminders = await ReminderService.listReminders(session.user.id)
    return NextResponse.json(reminders)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}
