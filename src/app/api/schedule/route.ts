import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { aiService } from "@/lib/services/ai-service"
import { EntryType } from "@/types"

const createScheduleSchema = z.object({
  date: z.string().datetime(),
  title: z.string().min(1),
  description: z.string().optional(),
  entries: z
    .array(
      z.object({
        taskId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        type: z.nativeEnum(EntryType).default(EntryType.TASK),
      })
    )
    .optional(),
  useAI: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = { userId: session.user.id }

    if (date) {
      const d = new Date(date)
      const startOfDay = new Date(d.setHours(0, 0, 0, 0))
      const endOfDay = new Date(d.setHours(23, 59, 59, 999))
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        entries: {
          include: {
            task: true,
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
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
    const validatedData = createScheduleSchema.parse(body)

    const scheduleDate = new Date(validatedData.date)
    scheduleDate.setHours(0, 0, 0, 0)

    const existingSchedule = await prisma.schedule.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: scheduleDate,
        },
      },
    })

    if (existingSchedule) {
      return NextResponse.json(
        { error: "Schedule already exists for this date" },
        { status: 409 }
      )
    }

    let entries = validatedData.entries || []

    if (validatedData.useAI !== false && entries.length === 0) {
      const tasks = await prisma.task.findMany({
        where: {
          userId: session.user.id,
          status: { not: "COMPLETED" },
          OR: [
            { dueDate: null },
            { dueDate: { gte: new Date() } },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 20,
      })

      const preferences = await prisma.userPreference.findUnique({
        where: { userId: session.user.id },
      })

      if (tasks.length > 0 && preferences) {
        try {
          const aiSchedule = await aiService.generateSchedule(
            tasks.map((t) => ({
              title: t.title,
              priority: t.priority,
              estimatedDuration: t.estimatedDuration || undefined,
            })),
            {
              workingHoursStart: preferences.workingHoursStart,
              workingHoursEnd: preferences.workingHoursEnd,
              workingDays: preferences.workingDays.split(",").map(Number),
            },
            scheduleDate
          )

          entries = aiSchedule.map((entry) => ({
            taskId: tasks.find((t) => t.title === entry.title)?.id,
            title: entry.title,
            description: "",
            startTime: new Date(
              `${scheduleDate.toISOString().split("T")[0]}T${entry.startTime}`
            ).toISOString(),
            endTime: new Date(
              `${scheduleDate.toISOString().split("T")[0]}T${entry.endTime}`
            ).toISOString(),
            type: entry.type as EntryType,
          }))
        } catch (error) {
          console.error("AI schedule generation failed:", error)
        }
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId: session.user.id,
        date: scheduleDate,
        title: validatedData.title,
        description: validatedData.description,
        aiGenerated: validatedData.useAI !== false,
        entries: {
          create: entries.map((entry) => ({
            taskId: entry.taskId,
            title: entry.title,
            description: entry.description,
            startTime: new Date(entry.startTime),
            endTime: new Date(entry.endTime),
            type: entry.type,
          })),
        },
      },
      include: {
        entries: {
          include: {
            task: true,
          },
        },
      },
    })

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "OTHER",
        title: `Created schedule: ${schedule.title}`,
        metadata: JSON.stringify({ scheduleId: schedule.id, date: schedule.date }),
        startedAt: new Date(),
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
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
    const scheduleId = searchParams.get("id")

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    const existingSchedule = await prisma.schedule.findFirst({
      where: { id: scheduleId, userId: session.user.id },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    await prisma.schedule.delete({ where: { id: scheduleId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    )
  }
}
