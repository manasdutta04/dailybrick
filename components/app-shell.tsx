"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { AuthPage } from "@/components/auth-page"
import { Sidebar, Topbar, BottomNav } from "@/components/layout"
import { DashboardPage } from "@/components/dashboard-page"
import { TeamPage } from "@/components/team-page"
import { ProgressPage } from "@/components/progress-page"
import { SettingsPage } from "@/components/settings-page"
import { ToastContainer, useToasts } from "@/components/toast-notifications"
import {
  getCurrentUser,
  getDueReminderTasks,
  loadAppSnapshot,
  markDueRemindersAsSent,
  onAuthStateChange,
  signOut,
} from "@/lib/dailybrick-api"
import type { DashboardQuickStats, Task, TeamMember, TopicProgress, UserProfile } from "@/lib/types"

type Page = "dashboard" | "team" | "settings" | "progress"

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  team: "Team",
  settings: "Settings",
  progress: "Progress",
}

const pagePaths: Record<Page, string> = {
  dashboard: "/",
  team: "/team",
  settings: "/settings",
  progress: "/progress",
}

function pathToPage(pathname: string): Page {
  if (pathname.startsWith("/team")) return "team"
  if (pathname.startsWith("/settings")) return "settings"
  if (pathname.startsWith("/progress")) return "progress"
  return "dashboard"
}

export function AppShell() {
  const router = useRouter()
  const pathname = usePathname()
  const activePage = pathToPage(pathname)

  const [user, setUser] = useState<User | null>(null)
  const [isBooting, setIsBooting] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamCode, setTeamCode] = useState<string | null>(null)
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [carriedTasks, setCarriedTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [topics, setTopics] = useState<TopicProgress[]>([])
  const [quickStats, setQuickStats] = useState<DashboardQuickStats>({
    streak: "0 days",
    doneThisWeek: "0 tasks",
    topTopic: "No topic yet",
    teamMembers: "0/2",
  })
  const { toasts, showNotification, dismissToast } = useToasts()
  const lastLoadErrorRef = useRef<string | null>(null)

  const userDisplayName = useMemo(() => {
    if (profile?.fullName) return profile.fullName
    if (user?.email) return user.email.split("@")[0] ?? "DailyBrick User"
    return "DailyBrick User"
  }, [profile?.fullName, user?.email])

  const userEmail = profile?.email ?? user?.email ?? ""

  const refreshAll = useCallback(async () => {
    if (!user) return
    try {
      setIsLoadingData(true)
      const snapshot = await loadAppSnapshot(user)
      setProfile(snapshot.profile)
      setTeamId(snapshot.teamId)
      setTeamCode(snapshot.teamCode)
      setTeamOwnerId(snapshot.teamOwnerId)
      setTasks(snapshot.tasks)
      setCarriedTasks(snapshot.carriedTasks)
      setTeamMembers(snapshot.teamMembers)
      setTopics(snapshot.topics)
      setQuickStats(snapshot.quickStats)
      lastLoadErrorRef.current = null
    } catch (err) {
      const originalMessage = err instanceof Error ? err.message : "Could not load app data"
      const mappedMessage =
        /404|relation|profiles|tasks|not found/i.test(originalMessage)
          ? "Supabase tables are missing. Run supabase/schema.sql in Supabase SQL Editor."
          : originalMessage

      if (lastLoadErrorRef.current !== mappedMessage) {
        showNotification(mappedMessage)
        lastLoadErrorRef.current = mappedMessage
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [showNotification, user])

  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      setUser(null)
      setProfile(null)
      setTeamId(null)
      setTeamCode(null)
      setTeamOwnerId(null)
      setTasks([])
      setCarriedTasks([])
      setTeamMembers([])
      setTopics([])
      router.push("/")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not sign out"
      showNotification(message)
    }
  }, [router, showNotification])

  const handleNavigate = useCallback(
    (page: Page) => {
      router.push(pagePaths[page])
    },
    [router]
  )

  const handleNotificationClick = useCallback(() => {
    const pendingToday = tasks.filter((t) => t.status === "pending").length
    const pendingCarried = carriedTasks.filter((t) => t.status === "pending").length
    const totalPending = pendingToday + pendingCarried

    if (totalPending === 0) {
      showNotification("No pending tasks right now. Great job!")
      return
    }

    showNotification(`You have ${totalPending} pending task${totalPending > 1 ? "s" : ""}.`)
  }, [carriedTasks, showNotification, tasks])

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        const current = await getCurrentUser()
        if (isMounted) setUser(current)
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsBooting(false)
      }
    }

    void bootstrap()

    const { data } = onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return
    void refreshAll()
  }, [refreshAll, user])

  useEffect(() => {
    if (!user) return

    const runReminderPoll = async () => {
      try {
        const due = await getDueReminderTasks(user.id)
        if (due.length === 0) return
        due.forEach((task) => {
          showNotification(`Reminder: ${task.title} at ${task.time}`)
        })
        await markDueRemindersAsSent(due.map((task) => task.id))
      } catch {
        // Notification polling should stay best-effort.
      }
    }

    void runReminderPoll()
    const interval = window.setInterval(() => {
      void runReminderPoll()
    }, 30 * 1000)

    return () => window.clearInterval(interval)
  }, [showNotification, user])

  if (isBooting) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    return (
      <AuthPage
        onLogin={() => {
          void getCurrentUser()
            .then((u) => {
              setUser(u)
              if (!u) {
                showNotification("Check your email for confirmation, then sign in.")
              }
            })
            .catch(() => {
              setUser(null)
            })
        }}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={() => void handleLogout()}
          userName={userDisplayName}
          userEmail={userEmail}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={pageTitles[activePage]}
          onNotificationClick={handleNotificationClick}
          onLogout={() => void handleLogout()}
          userName={userDisplayName}
        />

        <main className="flex-1 px-4 py-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          {isLoadingData && <p className="text-xs text-muted-foreground mb-4">Syncing DailyBrick...</p>}
          {activePage === "dashboard" && (
            <DashboardPage
              userName={userDisplayName}
              tasks={tasks}
              carriedTasks={carriedTasks}
              setTasks={setTasks}
              setCarriedTasks={setCarriedTasks}
              teamId={teamId}
              userId={user.id}
              quickStats={quickStats}
              refreshAll={refreshAll}
              showNotification={showNotification}
            />
          )}
          {activePage === "team" && (
            <TeamPage
              user={user}
              teamId={teamId}
              teamCode={teamCode}
              teamOwnerId={teamOwnerId}
              teamMembers={teamMembers}
              refreshAll={refreshAll}
              showNotification={showNotification}
            />
          )}
          {activePage === "progress" && <ProgressPage topics={topics} />}
          {activePage === "settings" && <SettingsPage userName={userDisplayName} userEmail={userEmail} />}
        </main>

        <BottomNav activePage={activePage} onNavigate={handleNavigate} />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
