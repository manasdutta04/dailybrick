"use client"

import { CalendarClock, CheckSquare, BarChart3, Users2 } from "lucide-react"
import { OverviewCards } from "@/components/overview-cards"
import { TasksSection } from "@/components/tasks-section"
import type { DashboardQuickStats, Task } from "@/lib/types"

interface DashboardPageProps {
  userName: string
  tasks: Task[]
  carriedTasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setCarriedTasks: React.Dispatch<React.SetStateAction<Task[]>>
  teamId: string | null
  userId: string
  quickStats: DashboardQuickStats
  refreshAll: () => Promise<void>
  showNotification: (msg: string) => void
}

export function DashboardPage({
  userName,
  tasks,
  carriedTasks,
  setTasks,
  setCarriedTasks,
  teamId,
  userId,
  quickStats,
  refreshAll,
  showNotification,
}: DashboardPageProps) {
  const stats = [
    { label: "Streak", value: quickStats.streak, icon: CalendarClock },
    { label: "Done this week", value: quickStats.doneThisWeek, icon: CheckSquare },
    { label: "Top topic", value: quickStats.topTopic, icon: BarChart3 },
    { label: "Team rank", value: quickStats.teamRank, icon: Users2 },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Date greeting */}
      <div>
        <h2 className="text-lg font-semibold text-foreground text-balance">
          Good morning, {userName.split(" ")[0]}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-4 py-3">
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overview cards */}
      <OverviewCards tasks={tasks} />

      {/* Tasks */}
      <TasksSection
        userId={userId}
        teamId={teamId}
        tasks={tasks}
        carriedTasks={carriedTasks}
        setTasks={setTasks}
        setCarriedTasks={setCarriedTasks}
        refreshAll={refreshAll}
        showNotification={showNotification}
      />
    </div>
  )
}
