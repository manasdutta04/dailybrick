"use client"

import Link from "next/link"
import { Box, ChevronRight, Sparkles, Users, CheckCircle2, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-12 h-80 w-80 rounded-full bg-primary/9 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-border/70 backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-tight">DailyBrick</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Build consistency daily</p>
            </div>
          </div>
          <Button asChild className="rounded-xl h-9 px-4">
            <Link href="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 min-h-[calc(100dvh-74px)] flex items-center py-8 md:py-10">
        <section className="w-full grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Tasks, Team Sync, Progress, Smart Reminders
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
              Stay consistent.
              <br />
              Finish what matters.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              DailyBrick keeps your day focused with clean task tracking, team accountability, carry-forward logic,
              and reminders that nudge you at the right time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 px-6 rounded-xl text-sm font-medium">
                <Link href="/auth" className="inline-flex items-center gap-2">
                  Get started
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6 rounded-xl text-sm">
                <Link href="/auth">Create account</Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md pt-1">
              {[
                { label: "Carry-forward", value: "Auto" },
                { label: "Team", value: "2 members" },
                { label: "Reminders", value: "Realtime" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/70 bg-card/60 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-border/70 p-6 md:p-7 shadow-2xl shadow-black/15">
            <div className="space-y-4">
              {[
                { icon: CheckCircle2, title: "Daily tasks", text: "Plan and complete tasks with carry-forward for pending work." },
                { icon: Users, title: "2-member teams", text: "Stay aligned with one accountability partner." },
                { icon: BellRing, title: "Smart reminders", text: "Get timely nudges for tasks that are due now." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <item.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
