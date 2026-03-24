"use client"

import { useState } from "react"
import { AuthPage } from "@/components/auth-page"
import { Sidebar, Topbar, BottomNav } from "@/components/layout"
import { DashboardPage } from "@/components/dashboard-page"
import { TeamPage } from "@/components/team-page"
import { ProgressPage } from "@/components/progress-page"
import { SettingsPage } from "@/components/settings-page"
import { ToastContainer, useToasts } from "@/components/toast-notifications"
import { mockTasks, Task } from "@/lib/mock-data"

type Page = "dashboard" | "team" | "settings" | "progress"

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  team: "Team",
  settings: "Settings",
  progress: "Progress",
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activePage, setActivePage] = useState<Page>("dashboard")
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const { toasts, showNotification, dismissToast } = useToasts()

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => setActivePage(page)}
          onLogout={() => setIsAuthenticated(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={pageTitles[activePage]}
          onNotificationClick={() =>
            showNotification("You have 2 pending tasks for today. Don't forget to check in!")
          }
          onNavigate={(page) => setActivePage(page)}
          activePage={activePage}
          onLogout={() => setIsAuthenticated(false)}
        />

        <main className="flex-1 px-4 py-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          {activePage === "dashboard" && (
            <DashboardPage tasks={tasks} setTasks={setTasks} showNotification={showNotification} />
          )}
          {activePage === "team" && <TeamPage />}
          {activePage === "progress" && <ProgressPage />}
          {activePage === "settings" && <SettingsPage />}
        </main>

        {/* Bottom nav — mobile only */}
        <BottomNav activePage={activePage} onNavigate={(page) => setActivePage(page)} />
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
