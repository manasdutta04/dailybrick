"use client"

import { BarChart3 } from "lucide-react"
import type { TopicProgress } from "@/lib/types"

const colorClasses = [
  { bar: "bg-primary", text: "text-primary" },
  { bar: "bg-chart-2", text: "text-chart-2" },
  { bar: "bg-chart-3", text: "text-chart-3" },
  { bar: "bg-chart-4", text: "text-chart-4" },
  { bar: "bg-chart-5", text: "text-chart-5" },
]

interface ProgressPageProps {
  topics: TopicProgress[]
}

export function ProgressPage({ topics }: ProgressPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Progress by Topic</h3>
        </div>
        <div className="p-5 flex flex-col gap-5">
          {topics.length === 0 && <p className="text-sm text-muted-foreground">No topic data yet.</p>}
          {topics.map((topic, idx) => {
            const pct = Math.round((topic.completed / topic.total) * 100)
            const { bar, text } = colorClasses[idx % colorClasses.length]
            return (
              <div key={topic.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{topic.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {topic.completed}/{topic.total} tasks
                    </span>
                    <span className={`text-sm font-bold ${text}`}>{pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {topics.map((topic, idx) => {
          const pct = Math.round((topic.completed / topic.total) * 100)
          const { text } = colorClasses[idx % colorClasses.length]
          return (
            <div
              key={topic.id}
              className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-xs text-muted-foreground mb-1">{topic.name}</p>
              <p className={`text-2xl font-bold ${text} mb-1`}>{pct}%</p>
              <p className="text-xs text-muted-foreground">
                {topic.completed} of {topic.total} completed
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
