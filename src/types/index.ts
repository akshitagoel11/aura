export enum TaskCategory {
  WORK = "WORK",
  PERSONAL = "PERSONAL",
  LEARNING = "LEARNING",
  HEALTH = "HEALTH",
  FINANCE = "FINANCE",
  MEETING = "MEETING",
  CREATIVE = "CREATIVE",
  OTHER = "OTHER",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ActivityType {
  TASK = "TASK",
  MEETING = "MEETING",
  BREAK = "BREAK",
  FOCUS = "FOCUS",
  LEARNING = "LEARNING",
  OTHER = "OTHER",
}

export enum ScheduleStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum EntryType {
  TASK = "TASK",
  MEETING = "MEETING",
  BREAK = "BREAK",
  FOCUS = "FOCUS",
  LEARNING = "LEARNING",
}

export interface User {
  id: string
  name?: string | null
  email: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string | null
  category: TaskCategory
  priority: Priority
  status: TaskStatus
  dueDate?: Date | null
  estimatedDuration?: number | null
  actualDuration?: number | null
  aiGenerated: boolean
  googleTaskId?: string | null
  googleCalendarId?: string | null
  notifiedEmails?: string | null
  assigneeEmail?: string | null
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
}

export interface CreateTaskInput {
  title: string
  description?: string
  category?: TaskCategory
  priority?: Priority
  dueDate?: Date
  estimatedDuration?: number
  assigneeEmail?: string
  syncToGoogleTasks?: boolean
  syncToGoogleCalendar?: boolean
  sendEmailNotification?: boolean
}

export interface GoogleSyncStatus {
  googleTaskSynced: boolean
  googleCalendarSynced: boolean
  emailsSent: string[]
  errors: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  category?: TaskCategory
  priority?: Priority
  status?: TaskStatus
  dueDate?: Date | null
  estimatedDuration?: number
  actualDuration?: number
}

export interface Activity {
  id: string
  userId: string
  type: ActivityType
  title: string
  description?: string | null
  metadata?: Record<string, any> | null
  startedAt: Date
  endedAt?: Date | null
  duration?: number | null
  createdAt: Date
}

export interface CreateActivityInput {
  type: ActivityType
  title: string
  description?: string
  metadata?: Record<string, any>
  startedAt: Date
  endedAt?: Date
  duration?: number
}

export interface Schedule {
  id: string
  userId: string
  date: Date
  title: string
  description?: string | null
  status: ScheduleStatus
  aiGenerated: boolean
  createdAt: Date
  updatedAt: Date
  entries?: ScheduleEntry[]
}

export interface ScheduleEntry {
  id: string
  scheduleId: string
  taskId?: string | null
  title: string
  description?: string | null
  startTime: Date
  endTime: Date
  type: EntryType
  createdAt: Date
  task?: Task | null
}

export interface CreateScheduleInput {
  date: Date
  title: string
  description?: string
  entries?: CreateScheduleEntryInput[]
}

export interface CreateScheduleEntryInput {
  taskId?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: EntryType
}

export interface Analytics {
  id: string
  userId: string
  date: Date
  productivityScore: number
  tasksCompleted: number
  tasksCreated: number
  focusTime: number
  breakTime: number
  meetingTime: number
  categoryData?: Record<string, number> | null
  createdAt: Date
  updatedAt: Date
}

export interface UserPreference {
  id: string
  userId: string
  workingHoursStart: number
  workingHoursEnd: number
  workingDays: string
  timezone: string
  aiProvider: string
  theme: string
  notifications: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AIIntent {
  intent: string
  confidence: number
  parameters: Record<string, any>
  actions: AIAction[]
  rawResponse?: string
}

export interface AIAction {
  type: string
  description: string
  data?: Record<string, any>
}

export interface AIAssistantMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  intent?: AIIntent
  timestamp: Date
}

export interface ProductivityMetrics {
  productivityScore: number
  tasksCompleted: number
  tasksCreated: number
  completionRate: number
  focusTime: number
  breakTime: number
  meetingTime: number
  categoryDistribution: Record<string, number>
  weeklyTrend: Array<{
    date: string
    score: number
    tasksCompleted: number
  }>
}

export interface DashboardData {
  tasks: Task[]
  activities: Activity[]
  schedule?: Schedule
  analytics?: Analytics
  metrics: ProductivityMetrics
}
