"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Sidebar, Topbar, BottomNav } from "@/components/layout"
import { DashboardPage } from "@/components/dashboard-page"
import { TeamPage } from "@/components/team-page"
import { ProgressPage } from "@/components/progress-page"
import { SettingsPage } from "@/components/settings-page"
import { ToastContainer, useToasts } from "@/components/toast-notifications"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  getCurrentUser,
  getDueReminderTasks,
  loadAppSnapshot,
  markDueRemindersAsSent,
  onAuthStateChange,
  signOut,
} from "@/lib/dailybrick-api"
import type { DashboardQuickStats, Task, TeamMember, TopicProgress, UserProfile } from "@/lib/types"
import type { AppSnapshot } from "@/lib/types"

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

let appSnapshotCache: { userId: string; snapshot: AppSnapshot } | null = null

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`dash-stat-${index}`} className="rounded-2xl border border-border/80 bg-card p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </div>
  )
}

function TeamSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`team-member-${index}`} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`progress-topic-${index}`} className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function PageSkeleton({ page }: { page: Page }) {
  if (page === "team") return <TeamSkeleton />
  if (page === "progress") return <ProgressSkeleton />
  if (page === "settings") return <SettingsSkeleton />
  return <DashboardSkeleton />
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
  const browserNotificationPermissionAskedRef = useRef(false)
  const reminderModeNoticeShownRef = useRef(false)

  const userDisplayName = useMemo(() => {
    if (profile?.fullName) return profile.fullName
    if (user?.email) return user.email.split("@")[0] ?? "DailyBrick User"
    return "DailyBrick User"
  }, [profile?.fullName, user?.email])

  const userEmail = profile?.email ?? user?.email ?? ""

  const applySnapshot = useCallback((snapshot: AppSnapshot) => {
    setProfile(snapshot.profile)
    setTeamId(snapshot.teamId)
    setTeamCode(snapshot.teamCode)
    setTeamOwnerId(snapshot.teamOwnerId)
    setTasks(snapshot.tasks)
    setCarriedTasks(snapshot.carriedTasks)
    setTeamMembers(snapshot.teamMembers)
    setTopics(snapshot.topics)
    setQuickStats(snapshot.quickStats)
  }, [])

  const refreshAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return
    try {
      if (!options?.silent) {
        setIsLoadingData(true)
      }
      const snapshot = await loadAppSnapshot(user)
      applySnapshot(snapshot)
      appSnapshotCache = { userId: user.id, snapshot }
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
      if (!options?.silent) {
        setIsLoadingData(false)
      }
    }
  }, [applySnapshot, showNotification, user])

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
      appSnapshotCache = null
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

    const cached = appSnapshotCache
    if (cached && cached.userId === user.id) {
      applySnapshot(cached.snapshot)
      setIsLoadingData(false)
      void refreshAll({ silent: true })
      return
    }

    void refreshAll()
  }, [applySnapshot, refreshAll, user])

  useEffect(() => {
    if (!user || reminderModeNoticeShownRef.current) return

    const provider = user.app_metadata?.provider
    if (provider !== "google") {
      showNotification("Email account detected: reminders will use in-app and browser notifications.")
    }

    reminderModeNoticeShownRef.current = true
  }, [showNotification, user])

  useEffect(() => {
    if (!user) return

    const runReminderPoll = async () => {
      try {
        const due = await getDueReminderTasks(user.id)
        if (due.length === 0) return

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "default" &&
          !browserNotificationPermissionAskedRef.current
        ) {
          browserNotificationPermissionAskedRef.current = true
          void Notification.requestPermission()
        }

        due.forEach((task) => {
          const message = `Reminder: ${task.title} at ${task.time}`
          showNotification(message)

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("DailyBrick reminder", {
              body: `${task.title} at ${task.time}`,
            })
          }
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

  useEffect(() => {
    if (!isBooting && !user) {
      router.replace("/auth")
    }
  }, [isBooting, router, user])

  if (isBooting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onProfileClick={() => handleNavigate("settings")}
          onLogout={() => void handleLogout()}
          userName={userDisplayName}
          userEmail={userEmail}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={pageTitles[activePage]}
          onNotificationClick={handleNotificationClick}
          onProfileClick={() => handleNavigate("settings")}
          userName={userDisplayName}
        />

        <main className="flex-1 px-4 py-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          <div key={activePage} className="page-transition-in">
            {isLoadingData ? (
              <PageSkeleton page={activePage} />
            ) : (
              <>
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
                {activePage === "settings" && (
                  <SettingsPage
                    userId={user.id}
                    userName={userDisplayName}
                    userEmail={userEmail}
                    refreshAll={refreshAll}
                    showNotification={showNotification}
                  />
                )}
              </>
            )}
          </div>
        </main>

        <BottomNav activePage={activePage} onNavigate={handleNavigate} />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
