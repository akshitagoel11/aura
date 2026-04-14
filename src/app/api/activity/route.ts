import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { ActivityType } from "@/types"

const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  title: z.string().min(1),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
})

const updateActivitySchema = z.object({
  endedAt: z.string().datetime(),
  duration: z.number().int().positive(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    const where: any = { userId: session.user.id }

    if (type) where.type = type
    if (startDate || endDate) {
      where.startedAt = {}
      if (startDate) where.startedAt.gte = new Date(startDate)
      if (endDate) where.startedAt.lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ])

    const parseJSON = (str: any) => {
      if (!str) return null
      try {
        return typeof str === "string" ? JSON.parse(str) : str
      } catch (e) {
        return str
      }
    }

    return NextResponse.json({
      activities: activities.map(a => ({
        ...a,
        metadata: parseJSON(a.metadata)
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
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
    const validatedData = createActivitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        startedAt: validatedData.startedAt
          ? new Date(validatedData.startedAt)
          : new Date(),
        endedAt: validatedData.endedAt
          ? new Date(validatedData.endedAt)
          : null,
        duration: validatedData.duration,
      },
    })

    const parseJSON = (str: any) => {
      if (!str) return null
      try {
        return typeof str === "string" ? JSON.parse(str) : str
      } catch (e) {
        return str
      }
    }

    return NextResponse.json({
      ...activity,
      metadata: parseJSON(activity.metadata)
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating activity:", error)
    return NextResponse.json(
      { error: "Failed to create activity" },
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
    const activityId = searchParams.get("id")

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      )
    }

    const existingActivity = await prisma.activity.findFirst({
      where: { id: activityId, userId: session.user.id },
    })

    if (!existingActivity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateActivitySchema.parse(body)

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        endedAt: new Date(validatedData.endedAt),
        duration: validatedData.duration,
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating activity:", error)
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    )
  }
}
