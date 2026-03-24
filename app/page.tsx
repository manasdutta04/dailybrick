"use client"

import { useState } from "react"
import { AuthPage } from "@/components/auth-page"
import { Sidebar, Topbar } from "@/components/layout"
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
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={pageTitles[activePage]}
          onNotificationClick={() =>
            showNotification("You have 2 pending tasks for today. Don't forget to check in!")
          }
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {activePage === "dashboard" && (
            <DashboardPage tasks={tasks} setTasks={setTasks} showNotification={showNotification} />
          )}
          {activePage === "team" && <TeamPage />}
          {activePage === "progress" && <ProgressPage />}
          {activePage === "settings" && <SettingsPage />}
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
