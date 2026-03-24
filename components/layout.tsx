"use client"

import { Box, LayoutDashboard, Users, Settings, ChevronDown, Bell, LogOut, Sun, Moon, Monitor } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type Page = "dashboard" | "team" | "settings" | "progress"

interface NavbarProps {
  activePage: Page
  onNavigate: (page: Page) => void
  onLogout: () => void
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "team", label: "Team", icon: Users },
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
        className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors text-xs font-medium"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="w-3 h-3" />
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

({ activePage, onNavigate, onLogout }: NavbarProps) {
  return (
    <aside className="w-56 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Box className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">DailyBrick</span>
      </div>

      {/* Nav */}
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

      {/* User */}
      <div className="px-3 pb-4 flex flex-col gap-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            AJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">Alex Johnson</p>
            <p className="text-[10px] text-muted-foreground truncate">alex@example.com</p>
          </div>
        </div>
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
  onNotificationClick: () => void
}

export function Topbar({ title, onNotificationClick }: TopbarProps) {
  const [teamOpen, setTeamOpen] = useState(false)

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Team switcher */}
        <button
          onClick={() => setTeamOpen(!teamOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
        >
          <div className="w-4 h-4 rounded-sm bg-primary/30 flex items-center justify-center">
            <Users className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-xs font-medium">Team Alpha</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <button
          onClick={onNotificationClick}
          className="relative w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary cursor-pointer">
          AJ
        </div>
      </div>
    </header>
  )
}
