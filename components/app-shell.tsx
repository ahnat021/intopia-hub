"use client"

import { LoginGate } from "@/components/auth/login-gate"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { HubProvider } from "@/lib/hub-store"

function Gate() {
  const { status } = useAuth()
  if (status === "loading") return <div className="min-h-dvh bg-background" aria-busy="true" />
  if (status === "signedOut") return <LoginGate />
  return <HubDashboard />
}

/** The market store sits above auth so state survives "Switch Team" for multi-team demos. */
export function AppShell() {
  return (
    <HubProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HubProvider>
  )
}
