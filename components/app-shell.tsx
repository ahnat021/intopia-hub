"use client"

import { LoginGate } from "@/components/auth/login-gate"
import { PendingVerification } from "@/components/auth/pending-verification"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"
import { DonationGate } from "@/components/donation-gate"
import { useAuth } from "@/lib/auth-context"

function Gate() {
  const { status, team } = useAuth()
  if (status === "loading") return <div className="min-h-dvh" aria-busy="true" />
  if (status === "signedOut" || !team) return <LoginGate />
  if (team.kyc !== "approved") return <PendingVerification />
  return <HubDashboard />
}

export function AppShell() {
  return (
    <DonationGate>
      <Gate />
    </DonationGate>
  )
}
