"use client"

import { useState } from "react"
import { Plus, Check, Clock, Calendar, MoreHorizontal, Trash2, Edit, CheckSquare, Mail } from "lucide-react"
import { Task, TaskStatus, Priority } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTasks, useUpdateTask, useDeleteTask } from "@/lib/hooks"
import { getPriorityColor, getCategoryColor, formatDate, isOverdue } from "@/lib/utils"

interface TaskListProps {
  onCreateTask: () => void
}

export function TaskList({ onCreateTask }: TaskListProps) {
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL")
  const [search, setSearch] = useState("")
  
  const { data, isLoading } = useTasks({
    status: filter === "ALL" ? undefined : filter,
  })
  
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const tasks = data?.tasks || []
  
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ taskId, input: { status } })
  }

  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId)
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "COMPLETED":
        return <Check className="h-4 w-4 text-green-500" />
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
        <Button size="sm" onClick={onCreateTask}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as TaskStatus | "ALL")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Create your first task!
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                  task.status === "COMPLETED" ? "opacity-60" : ""
                }`}
              >
                <button
                  onClick={() =>
                    handleStatusChange(
                      task.id,
                      task.status === "COMPLETED" ? TaskStatus.TODO : TaskStatus.COMPLETED
                    )
                  }
                  className="mt-0.5"
                >
                  {getStatusIcon(task.status)}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium truncate ${
                        task.status === "COMPLETED" ? "line-through" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getCategoryColor(task.category)}`}
                    >
                      {task.category}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <span
                        className={`flex items-center gap-1 ${
                          isOverdue(task.dueDate) && task.status !== "COMPLETED"
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.estimatedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimatedDuration}m
                      </span>
                    )}
                    {/* Google Sync Indicators */}
                    {(task as any).googleTaskId && (
                      <span className="flex items-center gap-1 text-emerald-500" title="Synced to Google Tasks">
                        <CheckSquare className="h-3 w-3" />
                      </span>
                    )}
                    {(task as any).googleCalendarId && (
                      <span className="flex items-center gap-1 text-blue-500" title="Added to Google Calendar">
                        <Calendar className="h-3 w-3" />
                      </span>
                    )}
                    {(task as any).notifiedEmails && (
                      <span className="flex items-center gap-1 text-violet-500" title={`Notified: ${JSON.parse((task as any).notifiedEmails).join(", ")}`}>
                        <Mail className="h-3 w-3" />
                      </span>
                    )}
                    {(task as any).assigneeEmail && (
                      <span className="text-slate-400" title={`Assigned to: ${(task as any).assigneeEmail}`}>
                        → {(task as any).assigneeEmail}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(
                          task.id,
                          task.status === "IN_PROGRESS" ? TaskStatus.TODO : TaskStatus.IN_PROGRESS
                        )
                      }
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {task.status === "IN_PROGRESS" ? "Pause" : "Start"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(task.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
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
