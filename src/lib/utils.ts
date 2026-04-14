import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

export function getRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return formatDate(date)
}

export function isOverdue(date: Date | string): boolean {
  const now = new Date()
  const d = new Date(date)
  return d < now
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "text-red-500 bg-red-50 border-red-200"
    case "HIGH":
      return "text-orange-500 bg-orange-50 border-orange-200"
    case "MEDIUM":
      return "text-yellow-500 bg-yellow-50 border-yellow-200"
    case "LOW":
      return "text-green-500 bg-green-50 border-green-200"
    default:
      return "text-gray-500 bg-gray-50 border-gray-200"
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "WORK":
      return "bg-blue-100 text-blue-700"
    case "PERSONAL":
      return "bg-purple-100 text-purple-700"
    case "LEARNING":
      return "bg-green-100 text-green-700"
    case "HEALTH":
      return "bg-red-100 text-red-700"
    case "FINANCE":
      return "bg-emerald-100 text-emerald-700"
    case "MEETING":
      return "bg-orange-100 text-orange-700"
    case "CREATIVE":
      return "bg-pink-100 text-pink-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
