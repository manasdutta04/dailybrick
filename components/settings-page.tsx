"use client"

import { useEffect, useMemo, useState } from "react"
import { Settings, Bell, Moon, Globe, LifeBuoy, MessageSquareWarning, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { clearAllUserTasks, signInWithGoogle, updateProfileName } from "@/lib/dailybrick-api"

interface SettingsPageProps {
  userId: string
  userName: string
  userEmail: string
  refreshAll: () => Promise<void>
  showNotification: (message: string) => void
}

export function SettingsPage({ userId, userName, userEmail, refreshAll, showNotification }: SettingsPageProps) {
  const linkedInUrl = "https://www.linkedin.com/in/manasdutta04"
  const issuesUrl = "https://github.com/dyn0x/dailybrick/issues"

  const [nameInput, setNameInput] = useState(userName)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isClearingTasks, setIsClearingTasks] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const firstInitial = useMemo(() => userName.slice(0, 1).toUpperCase(), [userName])

  useEffect(() => {
    setNameInput(userName)
  }, [userName])

  const handleSaveName = async () => {
    try {
      setIsSavingName(true)
      await updateProfileName({ userId, fullName: nameInput })
      await refreshAll()
      showNotification("Profile updated")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update profile"
      showNotification(message)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleClearTasks = async () => {
    try {
      setIsClearingTasks(true)
      await clearAllUserTasks(userId)
      await refreshAll()
      showNotification("All your tasks were cleared")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not clear tasks"
      showNotification(message)
    } finally {
      setIsClearingTasks(false)
    }
  }

  const handleConnectGoogleCalendar = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not connect Google Calendar"
      showNotification(message)
    }
  }

  const openExternal = (url: string) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer")
    if (!opened) {
      showNotification("Could not open link. Please allow popups for this site.")
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-secondary/50 via-card to-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-primary/80">Account Settings</p>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Manage your DailyBrick workspace</h2>
            <p className="text-sm text-muted-foreground">
              Update your profile, control reminders, and manage account safety actions.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {firstInitial}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{userName}</p>
              <p className="text-xs text-muted-foreground leading-tight">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Profile</h3>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                {firstInitial}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your full name"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <Button
                onClick={() => void handleSaveName()}
                disabled={isSavingName || !nameInput.trim() || nameInput.trim() === userName.trim()}
                variant="outline"
                className="h-10 px-4 rounded-xl text-xs border-border text-foreground hover:bg-secondary"
              >
                {isSavingName ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <Moon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
            </div>
            {[
              {
                icon: Bell,
                label: "Push notifications",
                desc: "Get reminders for scheduled tasks",
                control: (
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={(checked) => {
                      setNotificationsEnabled(checked)
                      showNotification(checked ? "Notifications enabled" : "Notifications disabled")
                    }}
                    aria-label="Toggle push notifications"
                  />
                ),
              },
              {
                icon: Globe,
                label: "Language",
                desc: "English (US)",
                control: <span className="text-xs text-muted-foreground">Default</span>,
              },
            ].map(({ icon: Icon, label, desc, control }) => (
              <div key={label} className="flex items-center gap-4 py-1">
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {control}
              </div>
            ))}

            <div className="rounded-xl border border-border bg-secondary/40 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Google Calendar</p>
                <p className="text-xs text-muted-foreground">Connect Google so pending tasks sync as calendar reminders.</p>
              </div>
              <Button variant="outline" className="h-8 px-3 rounded-lg text-xs" onClick={() => void handleConnectGoogleCalendar()}>
                Connect
              </Button>
            </div>
          </div>

          <div className="bg-card border border-destructive/20 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              These actions are irreversible. Please proceed with caution.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void handleClearTasks()}
                disabled={isClearingTasks}
                variant="outline"
                className="h-9 px-4 rounded-xl text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                {isClearingTasks ? "Clearing..." : "Clear all tasks"}
              </Button>
              <Button
                onClick={() => void handleConnectGoogleCalendar()}
                variant="outline"
                className="h-9 px-4 rounded-xl text-xs border-border text-foreground hover:bg-secondary"
              >
                Reconnect Google
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Requests</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Need something in DailyBrick? Send a request and we will prioritize it.
            </p>
            <p className="text-[11px] text-muted-foreground/90 break-all">{issuesUrl}</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                className="justify-start h-9 rounded-xl text-xs"
                onClick={() => openExternal(issuesUrl)}
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Request a new feature
              </Button>
              <Button
                variant="outline"
                className="justify-start h-9 rounded-xl text-xs"
                onClick={() => openExternal(issuesUrl)}
              >
                <MessageSquareWarning className="w-3.5 h-3.5 mr-2" />
                Report a bug
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Help</h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Get in touch</p>
              <p className="text-foreground font-medium break-all">{linkedInUrl}</p>
            </div>
            <Button
              variant="outline"
              className="w-full h-9 rounded-xl text-xs"
              onClick={() => openExternal(linkedInUrl)}
            >
              Connect on LinkedIn
            </Button>
            <p className="text-[11px] text-muted-foreground">Developed by Manas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
