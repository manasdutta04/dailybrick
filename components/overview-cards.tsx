"use client"

import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react"
import type { Task } from "@/lib/types"

interface OverviewCardsProps {
  tasks: Task[]
}

export function OverviewCards({ tasks }: OverviewCardsProps) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === "completed").length
  const pending = tasks.filter((t) => t.status === "pending").length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const cards = [
    {
      label: "Total Tasks Today",
      value: total,
      icon: ListTodo,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      label: "Completion",
      value: `${pct}%`,
      icon: TrendingUp,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      isProgress: true,
      pct,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg, isProgress, pct }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {isProgress && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
