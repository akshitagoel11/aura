import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Task, CreateTaskInput, UpdateTaskInput } from "@/types"

const API_BASE = "/api/tasks"

interface TasksResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface TaskFilters {
  status?: string
  category?: string
  priority?: string
  overdue?: boolean
  page?: number
  limit?: number
}

async function fetchTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  const response = await fetch(`${API_BASE}?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch tasks")
  }
  return response.json()
}

async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error("Failed to create task")
  }
  return response.json()
}

async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const response = await fetch(`${API_BASE}?id=${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error("Failed to update task")
  }
  return response.json()
}

async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE}?id=${taskId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete task")
  }
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
