"use client"

import { useState } from "react"
import { Box, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/lib/dailybrick-api"

interface AuthPageProps {
  onLogin: () => void
}

export function AuthPage({ onLogin }: AuthPageProps) {
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
            <h1 className="text-xl font-semibold text-foreground mb-1">Continue with Google</h1>
            <p className="text-sm text-muted-foreground">
              DailyBrick now uses Google authentication only, including calendar sync permissions.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void handleGoogleSignIn()}
              className="w-full h-11 rounded-xl font-medium"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {loading ? "Redirecting to Google..." : "Continue with Google"}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
