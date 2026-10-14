"use client"

import { LoginGate } from "@/components/auth/login-gate"
import { PendingVerification } from "@/components/auth/pending-verification"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"
import { useAuth } from "@/lib/auth-context"
import { SiteFooter } from "@/components/site-footer"
import { DonationPrompt } from "@/components/donation-gate"

function Gate() {
  const { status, team } = useAuth()
  if (status === "loading") return <div className="min-h-dvh" aria-busy="true" />
  if (status === "signedOut" || !team) return <LoginGate />
  if (team.kyc !== "approved") return <PendingVerification />
  return (
    <>
      <HubDashboard />
      <DonationPrompt />
    </>
  )
}

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">
        <Gate />
      </div>
      <SiteFooter />
    </div>
  )
}
