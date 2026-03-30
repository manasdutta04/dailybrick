"use client"

import { Box, LayoutDashboard, Users, Settings, ChevronDown, Bell, LogOut, Sun, Moon, Monitor, BarChart2, BookText } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import type { ToastMessage } from "@/components/toast-notifications"

type Page = "dashboard" | "team" | "settings" | "progress" | "journal"

interface NavbarProps {
  activePage: Page
  onNavigate: (page: Page) => void
  onProfileClick: () => void
  onLogout: () => void
  userName: string
  userEmail: string
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "team", label: "Team", icon: Users },
  { id: "journal", label: "Journal", icon: BookText },
  { id: "progress", label: "Progress", icon: BarChart2 },
]

const bottomNavItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "team", label: "Team", icon: Users },
  { id: "journal", label: "Journal", icon: BookText },
  { id: "progress", label: "Progress", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
]

type ThemeOption = "light" | "dark" | "system"

const themeOptions: { value: ThemeOption; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const current = themeOptions.find((o) => o.value === theme) ?? themeOptions[2]
  const CurrentIcon = current.icon

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors text-xs font-medium"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="w-3 h-3 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-popover border border-border rounded-xl shadow-lg py-1 z-50">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-secondary/60",
                theme === value ? "text-primary font-medium" : "text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
              {theme === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ activePage, onNavigate, onProfileClick, onLogout, userName, userEmail }: NavbarProps) {
  return (
    <aside className="w-56 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Box className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">DailyBrick</span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              activePage === id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4 flex flex-col gap-1">
        <button
          onClick={onProfileClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors text-left"
          aria-label="Open settings"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

interface TopbarProps {
  title: string
  onProfileClick: () => void
  userName: string
  notifications: ToastMessage[]
  onClearNotifications: () => void
}

export function Topbar({ title, onProfileClick, userName, notifications, onClearNotifications }: TopbarProps) {
  const [openNotifications, setOpenNotifications] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setOpenNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const sortedNotifications = [...notifications].reverse()

  return (
    <header className="h-14 md:h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Box className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">DailyBrick</span>
        </div>
        <h1 className="hidden md:block text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setOpenNotifications((prev) => !prev)}
            className="relative w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[85vw] bg-popover border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/70">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <button
                  onClick={onClearNotifications}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                {sortedNotifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet</div>
                ) : (
                  sortedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-start gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground leading-relaxed break-words">{notification.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onProfileClick}
          className="hidden md:flex w-8 h-8 rounded-full bg-primary/20 items-center justify-center text-xs font-semibold text-primary"
          aria-label="Open settings"
        >
          {userName.slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  )
}

interface BottomNavProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-20">
      {bottomNavItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-150",
            activePage === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  )
}
