import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { aiService } from "@/lib/services/ai-service"

const categorizeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = categorizeSchema.parse(body)

    const result = await aiService.autoCategorizeTask(
      validatedData.title,
      validatedData.description
    )

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error categorizing task:", error)
    return NextResponse.json(
      { error: "Failed to categorize task" },
      { status: 500 }
    )
  }
}
