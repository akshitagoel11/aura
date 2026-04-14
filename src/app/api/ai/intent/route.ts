import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { aiService } from "@/lib/services/ai-service"
import { prisma } from "@/lib/prisma"

const intentSchema = z.object({
  input: z.string().min(1, "Input is required"),
  context: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = intentSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        preferences: true,
        tasks: {
          where: { status: { not: "COMPLETED" } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    const context = {
      ...validatedData.context,
      userPreferences: user?.preferences,
      recentTasks: user?.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    }

    const intent = await aiService.parseIntent(validatedData.input, context)

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "OTHER",
        title: "AI Intent Parsed",
        description: `Input: ${validatedData.input}`,
        metadata: JSON.stringify({ intent: intent.intent, confidence: intent.confidence }),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({ intent })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error parsing intent:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse intent" },
      { status: 500 }
    )
  }
}
