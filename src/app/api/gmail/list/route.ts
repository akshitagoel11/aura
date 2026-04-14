import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EmailService } from "@/lib/services/email-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined

    const emails = await EmailService.listEmails(session.user.id, status)
    return NextResponse.json(emails)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
