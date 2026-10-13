"use client"

import { useCallback, useMemo, useState } from "react"
import { BadgeCheck, Compass, Lock } from "lucide-react"
import { RulesWaiver } from "./rules-waiver"
import { ProfessorConsole } from "./professor-console"
import { OnboardingTour, useFirstVisitTour } from "./onboarding-tour"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { isBankrupt, isProfessor, type Contract, type Listing } from "@/lib/domain"
import { FeaturedOpportunities } from "./featured-opportunities"
import { FreightTracker } from "./freight-tracker"
import { HubHeader } from "./hub-header"
import { LiveMarketplace } from "./live-marketplace"
import { MetricsStrip } from "./metrics-strip"
import { MyContracts } from "./my-contracts"
import { NegotiationSheet } from "./negotiation/negotiation-sheet"
import { PenaltyEstimator } from "./penalty-estimator"
import { PostListingDialog } from "./post-listing-dialog"
import { RulebookSheet } from "./rulebook-sheet"
import { ActivityFeed, Announcements, Leaderboard, MarketPulse, TopPartners } from "./sidebar-widgets"
import { TopBar } from "./top-bar"
import { Team25Hero } from "@/components/team-25-hero"

export function HubDashboard() {
  const { team, signOut } = useAuth()
  const hub = useHub()
  const { listings, threads, contracts, lockedOut, openThread, postListing, settings } = hub
  const [session, setSession] = useState<{ listingId: string; threadId: string | null } | null>(null)
  const [tourOpen, setTourOpen] = useFirstVisitTour()
  const viewerId = team!.id
  const signed = hub.certifiedIds.includes(viewerId)
  const activeListing = session ? (listings.find((l) => l.id === session.listingId) ?? null) : null

  const contractListingIds = useMemo(
    () => new Set(contracts.filter((c) => c.initiatorId === viewerId || c.counterpartyId === viewerId).map((c) => c.listingId)),
    [contracts, viewerId],
  )

  const metrics = useMemo(() => {
    const active = listings.filter((l) => l.status !== "CLOSED")
    return {
      openListings: active.filter((l) => l.type === "BUY" || l.type === "SELL").length,
      teams: hub.teams.filter((t) => t.kyc === "approved" && !t.banned && !isBankrupt(t)).length,
      partnerships: active.filter((l) => l.type === "PARTNERSHIP").length,
      rnd: active.filter((l) => l.type === "RND").length,
    }
  }, [listings, hub.teams])

  const openListing = useCallback(
    (listing: Listing) => {
      if (listing.teamId !== viewerId) {
        setSession({ listingId: listing.id, threadId: openThread(listing, viewerId) })
        return
      }
      const latest = Object.values(threads)
        .filter((t) => t.listingId === listing.id && t.teamIds.includes(viewerId))
        .sort((a, b) => b.updatedAt - a.updatedAt)[0]
      setSession({ listingId: listing.id, threadId: latest?.id ?? null })
    },
    [openThread, threads, viewerId],
  )

  const openContract = useCallback((c: Contract) => setSession({ listingId: c.listingId, threadId: c.threadId }), [])

  if (!team) return null

  return (
    <div className="min-h-dvh">
      <TopBar team={team} onSignOut={() => void signOut()}>
        {signed && (
          <span className="hidden items-center gap-1.5 px-2 text-sm text-success md:inline-flex">
            <BadgeCheck className="size-4" aria-hidden />
            Waiver signed
          </span>
        )}
        {isProfessor(viewerId) && <ProfessorConsole />}
        <Button variant="ghost" size="sm" onClick={() => setTourOpen(true)}>
          <Compass aria-hidden />
          <span className="hidden md:inline">Tour</span>
          <span className="sr-only md:hidden">Replay tour</span>
        </Button>
        <RulebookSheet />
        <PostListingDialog teamId={team.id} locked={lockedOut || !signed} onPost={postListing} />
      </TopBar>
      <HubHeader />
      <Team25Hero />

      {lockedOut && (
        <div role="alert" className="border-b border-warning/40 bg-warning/10">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="size-4 text-warning" aria-hidden />
              Contracts locked for {settings.period} processing
              <span className="font-normal text-muted-foreground">· New listings, drafts and signatures are disabled until the facilitator reopens trading.</span>
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1440px] gap-4 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
        <MetricsStrip data={metrics} />

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8 lg:gap-6">
          <LiveMarketplace
            listings={listings}
            viewerId={viewerId}
            contractListingIds={contractListingIds}
            isLive={hub.isLive}
            onToggleLive={hub.toggleLive}
            onOpen={openListing}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            <FreightTracker shipments={hub.shipments} viewerId={viewerId} />
            <PenaltyEstimator contracts={contracts} viewerId={viewerId} />
          </div>
          <FeaturedOpportunities listings={listings} onView={openListing} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4 lg:gap-6" aria-label="Market insights">
          <Announcements announcements={hub.announcements} />
          <MyContracts contracts={contracts} viewerId={viewerId} onOpen={openContract} />
          <Leaderboard stats={hub.stats} viewerId={viewerId} />
          <ActivityFeed activity={hub.activity} />
          <MarketPulse listings={listings} />
          <TopPartners contracts={contracts} />
        </aside>
      </main>

      <NegotiationSheet
        listing={activeListing}
        threadId={session?.threadId ?? null}
        viewer={team}
        onSelectThread={(threadId) => setSession((s) => (s ? { ...s, threadId } : s))}
        onClose={() => setSession(null)}
      />
      <OnboardingTour open={tourOpen && signed} onOpenChange={setTourOpen} />
      <RulesWaiver teamName={team.name} open={!signed} onSign={hub.signWaiver} />
    </div>
  )
}
