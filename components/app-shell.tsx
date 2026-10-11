"use client"

import { LoginGate } from "@/components/auth/login-gate"
import { PendingVerification } from "@/components/auth/pending-verification"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"

function Gate() {
  const { status, team } = useAuth()
  const { approvedIds } = useHub()
  if (status === "loading") return <div className="min-h-dvh" aria-busy="true" />
  if (status === "signedOut" || !team) return <LoginGate />
  if (!approvedIds.includes(team.id)) return <PendingVerification />
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
