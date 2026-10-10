"use client"

import { LoginGate } from "@/components/auth/login-gate"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function Gate() {
  const { status } = useAuth()
  if (status === "loading") return <div className="min-h-dvh" aria-busy="true" />
  if (status === "signedOut") return <LoginGate />
  return <HubDashboard />
}

/** The hub store is provided at the root layout, so state survives "Switch Team" and visits to /admin. */
export function AppShell() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
