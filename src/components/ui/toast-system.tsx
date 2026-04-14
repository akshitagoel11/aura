"use client"

import * as React from "react"
import { X } from "lucide-react"

// ─── Toast State Management ────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "error" | "warning" | "google"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: React.ReactNode
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "CLEAR_TOASTS" }

let toastCount = 0
function genId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE
  return toastCount.toString()
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

const listeners: Array<(state: Toast[]) => void> = []
let memoryState: Toast[] = []

function dispatch(action: ToastAction) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = [action.toast, ...memoryState].slice(0, TOAST_LIMIT)
      break
    case "REMOVE_TOAST":
      memoryState = memoryState.filter((t) => t.id !== action.id)
      break
    case "CLEAR_TOASTS":
      memoryState = []
      break
  }
  listeners.forEach((listener) => listener([...memoryState]))
}

export function toast(props: Omit<Toast, "id">) {
  const id = genId()
  const t: Toast = { ...props, id }
  dispatch({ type: "ADD_TOAST", toast: t })

  // Auto-remove after duration
  const duration = props.duration ?? TOAST_REMOVE_DELAY
  if (duration > 0) {
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", id })
    }, duration)
  }

  return {
    id,
    dismiss: () => dispatch({ type: "REMOVE_TOAST", id }),
  }
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: "REMOVE_TOAST", id }),
    clearAll: () => dispatch({ type: "CLEAR_TOASTS" }),
  }
}

// ─── Toast Variant Styles ─────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  default:
    "bg-white border-slate-200 text-slate-900 shadow-lg shadow-slate-200/50",
  success:
    "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-lg shadow-emerald-200/50",
  error:
    "bg-red-50 border-red-200 text-red-900 shadow-lg shadow-red-200/50",
  warning:
    "bg-amber-50 border-amber-200 text-amber-900 shadow-lg shadow-amber-200/50",
  google:
    "bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-indigo-200 text-indigo-900 shadow-lg shadow-indigo-200/50",
}

// ─── Toaster Component ────────────────────────────────────────────────────────

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-300 animate-in slide-in-from-right-full fade-in ${
            variantStyles[t.variant || "default"]
          }`}
          role="alert"
        >
          {/* Icon by variant */}
          <div className="shrink-0 mt-0.5">
            {t.variant === "success" && (
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {t.variant === "error" && (
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            {t.variant === "warning" && (
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
            {t.variant === "google" && (
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
            )}
            {(!t.variant || t.variant === "default") && (
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-5">{t.title}</p>
            {t.description && (
              <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{t.description}</p>
            )}
            {t.action && <div className="mt-2">{t.action}</div>}
          </div>

          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded-lg p-1 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
