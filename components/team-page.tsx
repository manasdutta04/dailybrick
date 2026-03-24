"use client"

import { useState } from "react"
import { Copy, Check, UserPlus, Users, Mail, Lock } from "lucide-react"
import { createTeam, inviteTeamMember } from "@/lib/dailybrick-api"
import type { Task, TeamMember } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function TaskRowReadOnly({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/40 transition-colors">
      <div
        className={cn(
          "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0",
          task.status === "completed" ? "bg-primary/40 border-primary/40" : "border-border"
        )}
      >
        {task.status === "completed" && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
      </div>
      <p
        className={cn(
          "text-xs text-foreground flex-1 truncate",
          task.status === "completed" && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </p>
      <span className="text-[10px] text-muted-foreground shrink-0">{task.time}</span>
      <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" aria-label="View only" />
    </div>
  )
}

interface TeamPageProps {
  user: User
  teamId: string | null
  teamCode: string | null
  teamMembers: TeamMember[]
  refreshAll: () => Promise<void>
  showNotification: (msg: string) => void
}

export function TeamPage({ user, teamId, teamCode, teamMembers, refreshAll, showNotification }: TeamPageProps) {
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteSent, setInviteSent] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const copyCode = () => {
    if (!teamCode) return
    navigator.clipboard.writeText(teamCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateTeam = async () => {
    if (teamId) return
    try {
      setBusy(true)
      await createTeam(user)
      await refreshAll()
      showNotification("Team created successfully.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create team"
      showNotification(message)
    } finally {
      setBusy(false)
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    if (!teamId) {
      showNotification("Create your team first, then invite a member.")
      return
    }

    try {
      setBusy(true)
      await inviteTeamMember({ teamId, email: inviteEmail })
      setInviteSent(true)
      showNotification(`Invite sent to ${inviteEmail.trim().toLowerCase()}`)
      await refreshAll()
      setTimeout(() => {
        setInviteSent(false)
        setInviteEmail("")
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not invite member"
      showNotification(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!teamId && (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Create your team</h3>
            <p className="text-xs text-muted-foreground mt-1">
              DailyBrick supports 2 members per team. Create your team to invite one member.
            </p>
          </div>
          <Button
            onClick={() => void handleCreateTeam()}
            disabled={busy}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? "Creating..." : "Create Team"}
          </Button>
        </div>
      )}

      {/* Team info row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team code card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Team Code</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-2.5 rounded-xl bg-secondary font-mono text-sm tracking-widest text-foreground border border-border">
              {teamCode ?? "Not created yet"}
            </div>
            <button
              onClick={copyCode}
              disabled={!teamCode}
              aria-label="Copy team code"
              className={cn(
                "h-10 px-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-150",
                copied
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                !teamCode && "opacity-50 cursor-not-allowed"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Share this code with teammates to join your team (max 2 members).</p>
        </div>

        {/* Invite card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Invite Member</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendInvite()}
                className="pl-8 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl text-sm"
              />
            </div>
            <Button
              onClick={() => void sendInvite()}
              disabled={busy || !teamId}
              className={cn(
                "h-10 px-4 rounded-xl text-sm font-medium transition-all",
                inviteSent ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {inviteSent ? "Sent!" : "Invite"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Team is limited to 2 members. Invitation will be sent via email.</p>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
          <span className="ml-auto text-xs text-muted-foreground">{teamMembers.length}/2</span>
        </div>

        <div className="divide-y divide-border">
          {teamMembers.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No team members yet.
            </div>
          )}
          {teamMembers.map((member) => (
            <div key={member.id}>
              {/* Member row */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {member.avatarInitials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    {member.isYou && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-medium">You</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>

                {/* Progress */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold text-foreground">{member.completionPercent}%</span>
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${member.completionPercent}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded tasks */}
              {expandedMember === member.id && (
                <div className="px-5 pb-4 bg-secondary/20">
                  <p className="text-xs font-medium text-muted-foreground mb-2 pt-2">
                    {member.isYou ? "Your tasks" : `${member.name.split(" ")[0]}'s tasks (view only)`}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {member.tasks.map((task) => (
                      <TaskRowReadOnly key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
