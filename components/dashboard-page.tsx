"use client"

import { useEffect, useState } from "react"
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

function getTimeBasedGreeting(name: string): string {
  const hour = new Date().getHours()
  
  // Morning greetings (5-11)
  if (hour >= 5 && hour < 12) {
    const morningGreetings = [
      `Good morning, ${name}`,
      `Rise and shine, ${name}!`,
      `Wake up ${name}, let's get it done!`,
      `Morning, ${name} – time to shine!`,
      `You're cooking, ${name}!`,
      `Let's go, ${name}!`,
      `Seize the day, ${name}!`,
      `Ready to rock, ${name}?`,
    ]
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)]
  }
  
  // Afternoon greetings (12-17)
  if (hour >= 12 && hour < 18) {
    const afternoonGreetings = [
      `Afternoon vibes, ${name}!`,
      `Crushing it, ${name}!`,
      `Halfway there, ${name}!`,
      `Good going, ${name}!`,
      `Keep it up, ${name}!`,
      `You're on fire, ${name}!`,
      `Afternoon push, ${name}!`,
      `Still got it, ${name}!`,
    ]
    return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)]
  }
  
  // Evening greetings (18-4)
  const eveningGreetings = [
    `Evening, ${name}!`,
    `What's up, ${name}?`,
    `Night owl mode, ${name}?`,
    `Still going, ${name}!`,
    `Crazy, ${name} – in a good way!`,
    `You're unstoppable, ${name}!`,
    `No sleep, ${name}!`,
    `Legend, ${name}!`,
    `Keep grinding, ${name}!`,
    `Respect, ${name}!`,
    `Amazing, ${name}!`,
    `Legendary, ${name}!`,
  ]
  return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)]
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
  const [greeting, setGreeting] = useState(() => 
    getTimeBasedGreeting(userName.split(" ")[0])
  )

  useEffect(() => {
    setGreeting(getTimeBasedGreeting(userName.split(" ")[0]))
  }, [userName])

  const stats = [
    { label: "Streak", value: quickStats.streak, icon: CalendarClock },
    { label: "Done this week", value: quickStats.doneThisWeek, icon: CheckSquare },
    { label: "Top topic", value: quickStats.topTopic, icon: BarChart3 },
    { label: "Team members", value: quickStats.teamMembers, icon: Users2 },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Date greeting */}
      <div>
        <h2 className="text-lg font-semibold text-foreground text-balance">
          {greeting}
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
