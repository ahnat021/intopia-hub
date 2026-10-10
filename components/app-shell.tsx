"use client"

import { LoginGate } from "@/components/auth/login-gate"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function Gate() {
  const { status } = useAuth()
  if (status === "loading") return <div className="min-h-dvh bg-background" aria-busy="true" />
  if (status === "signedOut") return <LoginGate />
  return <HubDashboard />
}

export function AppShell() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
