"use client"

import { Settings, Bell, Moon, Globe, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsPageProps {
  userName: string
  userEmail: string
}

export function SettingsPage({ userName, userEmail }: SettingsPageProps) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <Settings className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Profile</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <Button variant="outline" className="h-8 px-4 rounded-xl text-xs border-border text-foreground hover:bg-secondary">
            Edit
          </Button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <Moon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
        </div>
        {[
          { icon: Bell, label: "Push notifications", desc: "Get reminders for scheduled tasks", enabled: true },
          { icon: Globe, label: "Language", desc: "English (US)", enabled: null },
          { icon: Shield, label: "Two-factor auth", desc: "Extra security for your account", enabled: false },
        ].map(({ icon: Icon, label, desc, enabled }) => (
          <div key={label} className="flex items-center gap-4 py-1">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            {enabled !== null && (
              <div
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${enabled ? "bg-primary" : "bg-secondary"} relative`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground/90 transition-all ${enabled ? "left-5" : "left-0.5"}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/20 rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        <p className="text-xs text-muted-foreground">These actions are irreversible. Please proceed with caution.</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-8 px-4 rounded-xl text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            Clear all tasks
          </Button>
          <Button
            variant="outline"
            className="h-8 px-4 rounded-xl text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )
}
