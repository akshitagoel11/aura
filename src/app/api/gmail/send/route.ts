import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EmailService } from "@/lib/services/email-service"
import { z } from "zod"

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  scheduledAt: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const accessToken = (session as any).accessToken
    if (!accessToken) {
      return NextResponse.json({ error: "Google OAuth access token missing. Please sign in with Google." }, { status: 401 })
    }

    const body = await request.json()
    const validated = sendEmailSchema.parse(body)

    const email = await EmailService.sendEmail({
      userId: session.user.id,
      ...validated,
      accessToken
    })

    return NextResponse.json(email, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send email" }, { status: 500 })
  }
}
