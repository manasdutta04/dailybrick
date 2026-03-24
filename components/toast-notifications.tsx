"use client"

import { useCallback, useEffect, useState } from "react"
import { X, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastMessage {
  id: string
  message: string
  timestamp: Date
}

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        "flex items-start gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg",
        "animate-in slide-in-from-right-5 fade-in duration-300 min-w-72 max-w-sm"
      )}
    >
      <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Bell className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground mb-0.5">DailyBrick</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showNotification = useCallback((message: string) => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, timestamp: new Date() }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showNotification, dismissToast }
}
