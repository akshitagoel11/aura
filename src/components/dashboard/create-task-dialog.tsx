"use client"

import { useState } from "react"
import { Plus, Sparkles, Mail, CheckSquare, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useCreateTask, useCategorizeTask } from "@/lib/hooks"
import { TaskCategory, Priority } from "@/types"

interface CreateTaskDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateTaskDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: CreateTaskDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.OTHER)
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [dueDate, setDueDate] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [assigneeEmail, setAssigneeEmail] = useState("")
  const [useAI, setUseAI] = useState(true)
  const [syncToGoogleTasks, setSyncToGoogleTasks] = useState(true)
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(true)
  const [sendEmailNotification, setSendEmailNotification] = useState(true)
  const [syncStatus, setSyncStatus] = useState<{
    googleTaskSynced?: boolean
    googleCalendarSynced?: boolean
    emailsSent?: string[]
  } | null>(null)

  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setIsOpen = onOpenChange || setUncontrolledOpen

  const createTask = useCreateTask()
  const categorizeTask = useCategorizeTask()

  const handleAICategorize = async () => {
    if (!title.trim()) return
    
    try {
      const result = await categorizeTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      })
      
      setCategory(result.category as TaskCategory)
      setEstimatedDuration(result.estimatedDuration.toString())
    } catch (error) {
      console.error("AI categorization failed:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      const result = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedDuration: estimatedDuration
          ? parseInt(estimatedDuration)
          : undefined,
        assigneeEmail: assigneeEmail.trim() || undefined,
        syncToGoogleTasks,
        syncToGoogleCalendar,
        sendEmailNotification: sendEmailNotification && !!assigneeEmail.trim(),
      } as any)

      // Show sync status briefly
      if ((result as any).googleSync) {
        setSyncStatus((result as any).googleSync)
        setTimeout(() => {
          setSyncStatus(null)
          resetForm()
          setIsOpen(false)
        }, 2000)
      } else {
        resetForm()
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setCategory(TaskCategory.OTHER)
    setPriority(Priority.MEDIUM)
    setDueDate("")
    setEstimatedDuration("")
    setAssigneeEmail("")
    setSyncStatus(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open) }}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-aura-600" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        {/* Sync Status Toast */}
        {syncStatus && (
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-semibold text-emerald-800">✅ Task Created & Synced!</p>
            <div className="flex flex-wrap gap-2">
              {syncStatus.googleTaskSynced && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-emerald-200 text-emerald-700 rounded-full px-3 py-1 font-medium">
                  <CheckSquare className="h-3 w-3" /> Google Tasks
                </span>
              )}
              {syncStatus.googleCalendarSynced && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-3 py-1 font-medium">
                  <Calendar className="h-3 w-3" /> Calendar Event
                </span>
              )}
              {syncStatus.emailsSent && syncStatus.emailsSent.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-violet-200 text-violet-700 rounded-full px-3 py-1 font-medium">
                  <Mail className="h-3 w-3" /> Notified {syncStatus.emailsSent.length}
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAICategorize}
                disabled={categorizeTask.isPending || !title.trim()}
                title="Auto-categorize with AI"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Assignee Email */}
          <div className="space-y-2">
            <Label htmlFor="assigneeEmail" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-violet-500" />
              Assignee Email
              <span className="text-xs text-muted-foreground font-normal">(will be notified)</span>
            </Label>
            <Input
              id="assigneeEmail"
              type="email"
              placeholder="colleague@gmail.com"
              value={assigneeEmail}
              onChange={(e) => setAssigneeEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TaskCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORK">Work</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="LEARNING">Learning</SelectItem>
                  <SelectItem value="HEALTH">Health</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="CREATIVE">Creative</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Google Integration Toggles */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Google Integrations</p>
            
            <label className="flex items-center gap-3 cursor-pointer group" id="toggle-google-tasks">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={syncToGoogleTasks}
                  onChange={(e) => setSyncToGoogleTasks(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Sync to Google Tasks</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group" id="toggle-google-calendar">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={syncToGoogleCalendar}
                  onChange={(e) => setSyncToGoogleCalendar(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-blue-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Add to Google Calendar</span>
                {!dueDate && <span className="text-xs text-slate-400">(set due date first)</span>}
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group" id="toggle-email-notification">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-violet-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Notify via Gmail</span>
                {!assigneeEmail && <span className="text-xs text-slate-400">(add assignee email)</span>}
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending || !title.trim()}>
              {createTask.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating & Syncing...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
