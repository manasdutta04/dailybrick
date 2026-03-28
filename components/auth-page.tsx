"use client"

import { useState } from "react"
import { Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/dailybrick-api"

interface AuthPageProps {
  onLogin: () => void
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
      onLogin()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed"
      setError(message)
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.")
      return
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (mode === "login") {
        await signInWithEmail(email.trim(), password)
        onLogin()
        return
      }

      const result = await signUpWithEmail(email.trim(), password, name.trim())
      if (result.session) {
        onLogin()
      } else {
        setError("Account created. Check your email verification link, then sign in.")
        setMode("login")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">DailyBrick</span>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground mb-1">Welcome to DailyBrick</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with Google for calendar sync, or use email/password with in-app reminders.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2">
              <p className="text-[11px] leading-relaxed text-primary">
                Google login: automatic Google Calendar sync. Email login: in-app and browser reminders only.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void handleGoogleSignIn()}
              className="w-full h-11 rounded-xl font-medium text-foreground hover:text-foreground"
            >
              <img src="/google-logo.svg" alt="Google" className="w-4 h-4 mr-2" />
              {loading ? "Redirecting to Google..." : "Continue with Google"}
            </Button>

            <div className="relative py-1">
              <div className="h-px bg-border" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 px-2 text-[11px] text-muted-foreground bg-background">
                or use email
              </span>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-secondary">
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  mode === "login"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-sm text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium mt-1"
              >
                {loading ? "Please wait..." : mode === "login" ? "Sign in with Email" : "Create Email Account"}
              </Button>
            </form>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
