"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Clock,
  Coffee,
  Brain,
  Users,
  MoreHorizontal,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ActivityType } from "@/types"
import { getRelativeTime, formatDuration } from "@/lib/utils"

interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string | null
  startedAt: Date
  endedAt?: Date | null
  duration?: number | null
}

interface ActivityTimelineProps {
  activities?: Activity[]
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: ActivityType.TASK,
    title: "Completed task: Review Q4 report",
    startedAt: new Date(Date.now() - 1000 * 60 * 30),
    duration: 45,
  },
  {
    id: "2",
    type: ActivityType.FOCUS,
    title: "Focus session",
    startedAt: new Date(Date.now() - 1000 * 60 * 90),
    duration: 60,
  },
  {
    id: "3",
    type: ActivityType.MEETING,
    title: "Team standup",
    description: "Daily team sync",
    startedAt: new Date(Date.now() - 1000 * 60 * 150),
    duration: 30,
  },
  {
    id: "4",
    type: ActivityType.BREAK,
    title: "Coffee break",
    startedAt: new Date(Date.now() - 1000 * 60 * 200),
    duration: 15,
  },
  {
    id: "5",
    type: ActivityType.LEARNING,
    title: "Read documentation",
    startedAt: new Date(Date.now() - 1000 * 60 * 300),
    duration: 30,
  },
]

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "TASK":
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    case "FOCUS":
      return <Brain className="h-4 w-4 text-purple-500" />
    case "MEETING":
      return <Users className="h-4 w-4 text-orange-500" />
    case "BREAK":
      return <Coffee className="h-4 w-4 text-green-500" />
    case "LEARNING":
      return <Calendar className="h-4 w-4 text-pink-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const getActivityColor = (type: ActivityType) => {
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

export function ActivityTimeline({ activities = mockActivities }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<ActivityType | "ALL">("ALL")

  const filteredActivities =
    filter === "ALL"
      ? activities
      : activities.filter((a) => a.type === filter)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-aura-500" />
          <CardTitle className="text-lg font-semibold">Activity Timeline</CardTitle>
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as ActivityType | "ALL")}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="TASK">Tasks</SelectItem>
            <SelectItem value="FOCUS">Focus</SelectItem>
            <SelectItem value="MEETING">Meetings</SelectItem>
            <SelectItem value="BREAK">Breaks</SelectItem>
            <SelectItem value="LEARNING">Learning</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pl-4">
          <div className="absolute left-6 top-2 bottom-2 w-px bg-border" />
          
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div key={activity.id} className="relative flex gap-4">
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white ${getActivityColor(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getActivityColor(activity.type)}`}
                        >
                          {activity.type}
                        </Badge>
                        {activity.duration && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(activity.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(activity.startedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
