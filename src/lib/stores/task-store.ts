import { create } from "zustand"
import { Task, TaskStatus, TaskCategory, Priority } from "@/types"

interface TaskFilters {
  status?: TaskStatus
  category?: TaskCategory
  priority?: Priority
  overdue?: boolean
  search?: string
}

interface TaskState {
  tasks: Task[]
  filteredTasks: Task[]
  filters: TaskFilters
  selectedTask: Task | null
  isLoading: boolean
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  setFilters: (filters: TaskFilters) => void
  setSelectedTask: (task: Task | null) => void
  setLoading: (loading: boolean) => void
  applyFilters: () => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  filters: {},
  selectedTask: null,
  isLoading: false,

  setTasks: (tasks) => {
    set({ tasks })
    get().applyFilters()
  },

  addTask: (task) => {
    const tasks = [task, ...get().tasks]
    set({ tasks })
    get().applyFilters()
  },

  updateTask: (taskId, updates) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    )
    set({ tasks })
    get().applyFilters()
  },

  removeTask: (taskId) => {
    const tasks = get().tasks.filter((t) => t.id !== taskId)
    set({ tasks })
    get().applyFilters()
  },

  setFilters: (filters) => {
    set({ filters })
    get().applyFilters()
  },

  setSelectedTask: (task) => set({ selectedTask: task }),

  setLoading: (loading) => set({ isLoading: loading }),

  applyFilters: () => {
    const { tasks, filters } = get()
    let filtered = [...tasks]

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status)
    }

    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category)
    }

    if (filters.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority)
    }

    if (filters.overdue) {
      const now = new Date()
      filtered = filtered.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
      )
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
      )
    }

    set({ filteredTasks: filtered })
  },
}))
