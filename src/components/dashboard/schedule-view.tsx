"use client"

import { useState } from "react"
import {
  Calendar,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"

interface ScheduleEntry {
  id: string
  title: string
  startTime: string
  endTime: string
  type: string
  description?: string
}

interface Schedule {
  date: Date
  entries: ScheduleEntry[]
}

const mockSchedule: Schedule = {
  date: new Date(),
  entries: [
    {
      id: "1",
      title: "Morning Standup",
      startTime: "09:00",
      endTime: "09:30",
      type: "MEETING",
    },
    {
      id: "2",
      title: "Focus: Deep Work",
      startTime: "09:30",
      endTime: "11:00",
      type: "FOCUS",
    },
    {
      id: "3",
      title: "Break",
      startTime: "11:00",
      endTime: "11:15",
      type: "BREAK",
    },
    {
      id: "4",
      title: "Review PRs",
      startTime: "11:15",
      endTime: "12:30",
      type: "TASK",
    },
    {
      id: "5",
      title: "Lunch",
      startTime: "12:30",
      endTime: "13:30",
      type: "BREAK",
    },
    {
      id: "6",
      title: "Team Meeting",
      startTime: "14:00",
      endTime: "15:00",
      type: "MEETING",
    },
    {
      id: "7",
      title: "Focus: Project Work",
      startTime: "15:00",
      endTime: "17:00",
      type: "FOCUS",
    },
  ],
}

const getEntryColor = (type: string) => {
  switch (type) {
    case "TASK":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "FOCUS":
      return "bg-purple-100 text-purple-700 border-purple-200"
    case "MEETING":
      return "bg-orange-100 text-orange-700 border-orange-200"
    case "BREAK":
      return "bg-green-100 text-green-700 border-green-200"
    case "LEARNING":
      return "bg-pink-100 text-pink-700 border-pink-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export function ScheduleView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week">("day")

  const navigateDate = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -1 : 1
    setCurrentDate(addDays(currentDate, days))
  }

  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-aura-500" />
          <CardTitle className="text-lg font-semibold">Schedule</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {format(currentDate, "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" className="ml-2">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setCurrentDate(day)}
              className={`flex-1 py-2 rounded-lg text-center transition-colors ${
                isSameDay(day, currentDate)
                  ? "bg-aura-500 text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <div className="text-xs">{format(day, "EEE")}</div>
              <div className="text-sm font-semibold">{format(day, "d")}</div>
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin">
          {mockSchedule.entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled items for this day
            </div>
          ) : (
            mockSchedule.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-sm font-medium">{entry.startTime}</span>
                  <span className="text-xs text-muted-foreground">
                    {entry.endTime}
                  </span>
                </div>

                <div className="w-px h-10 bg-border" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{entry.title}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getEntryColor(entry.type)}`}
                    >
                      {entry.type}
                    </Badge>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
