"use client"

import { useEffect, useState } from "react"
import { Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  bootstrapRecoverySessionFromUrl,
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from "@/lib/dailybrick-api"

interface AuthPageProps {
  onLogin: () => void
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeAuthError = (message: string) => {
    const lowered = message.toLowerCase()
    if (lowered.includes("email rate limit")) {
      return "Too many signup email requests. Wait a few minutes, then try again or sign in if you already created the account."
    }
    return message
  }

  useEffect(() => {
    const bootstrapRecovery = async () => {
      try {
        const started = await bootstrapRecoverySessionFromUrl()
        if (started) {
          setMode("reset")
          setError(null)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not start password recovery"
        setError(message)
      }
    }

    void bootstrapRecovery()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Email is required.")
        return
      }

      try {
        setLoading(true)
        await requestPasswordReset(email.trim(), window.location.origin)
        setError("Password reset link sent. Check your inbox.")
        setMode("login")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not send reset email"
        setError(normalizeAuthError(message))
      } finally {
        setLoading(false)
      }

      return
    }

    if (mode === "reset") {
      if (!newPassword.trim() || !confirmPassword.trim()) {
        setError("Please enter and confirm your new password.")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }

      try {
        setLoading(true)
        await updatePassword(newPassword)
        setError(null)
        onLogin()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not update password"
        setError(normalizeAuthError(message))
      } finally {
        setLoading(false)
      }

      return
    }

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.")
      return
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please add your full name.")
      return
    }

    try {
      setLoading(true)
      if (mode === "login") {
        await signInWithEmail(email.trim(), password)
        onLogin()
      } else {
        const result = await signUpWithEmail(email.trim(), password, name.trim())
        if (result.session) {
          onLogin()
        } else {
          setMode("login")
          setError("Signup successful. Check your email for verification, then sign in.")
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed"
      setError(normalizeAuthError(message))
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
            <h1 className="text-xl font-semibold text-foreground mb-1">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create an account"}
              {mode === "forgot" && "Reset your password"}
              {mode === "reset" && "Set a new password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login" && "Sign in to your DailyBrick workspace"}
              {mode === "signup" && "Start managing your daily tasks today"}
              {mode === "forgot" && "Enter your account email and we will send a reset link"}
              {mode === "reset" && "Choose a new password for your account"}
            </p>
          </div>

          {/* Mode tabs */}
          {(mode === "login" || mode === "signup") && (
            <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-6">
              <button
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
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-sm text-foreground">Full Name</Label>
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
            {(mode === "login" || mode === "signup" || mode === "forgot") && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>
            )}

            {(mode === "login" || mode === "signup") && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setMode("forgot")
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>
            )}

            {mode === "reset" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-password" className="text-sm text-foreground">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm-password" className="text-sm text-foreground">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                  />
                </div>
              </>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium mt-1"
            >
              {loading && "Please wait..."}
              {!loading && mode === "login" && "Sign in"}
              {!loading && mode === "signup" && "Create account"}
              {!loading && mode === "forgot" && "Send reset link"}
              {!loading && mode === "reset" && "Update password"}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </form>

          {(mode === "login" || mode === "signup") && (
            <p className="text-xs text-muted-foreground text-center mt-5">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <p className="text-xs text-muted-foreground text-center mt-5">
              <button
                onClick={() => {
                  setError(null)
                  setMode("login")
                }}
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
