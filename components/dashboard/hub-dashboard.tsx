"use client"

import { useCallback, useMemo, useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { TEAMS, type Contract, type Listing } from "@/lib/mock-data"
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

export function HubDashboard() {
  const { team, signOut } = useAuth()
  const hub = useHub()
  const { listings, threads, contracts, lockedOut, setLockedOut, openThread, postListing } = hub
  const [session, setSession] = useState<{ listingId: string; threadId: string | null } | null>(null)

  const viewerId = team!.id
  const activeListing = session ? (listings.find((l) => l.id === session.listingId) ?? null) : null

  const contractListingIds = useMemo(
    () => new Set(contracts.filter((c) => c.initiatorId === viewerId || c.counterpartyId === viewerId).map((c) => c.listingId)),
    [contracts, viewerId],
  )

  const metrics = useMemo(() => {
    const active = listings.filter((l) => l.status !== "CLOSED")
    return {
      openListings: active.filter((l) => l.type === "BUY" || l.type === "SELL").length,
      teams: TEAMS.filter((t) => t.equity >= 0).length,
      partnerships: active.filter((l) => l.type === "PARTNERSHIP").length,
      rnd: active.filter((l) => l.type === "RND").length,
    }
  }, [listings])

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
      <TopBar team={team} lockedOut={lockedOut} onSignOut={signOut}>
        <RulebookSheet />
        <PostListingDialog teamId={team.id} locked={lockedOut} onPost={postListing} />
      </TopBar>
      <HubHeader lockedOut={lockedOut} onToggleLockout={() => setLockedOut(!lockedOut)} />

      {lockedOut && (
        <div role="alert" className="border-b border-amber-500/40 bg-amber-500/10">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Lock className="size-4" aria-hidden />
              Contracts Locked for Period 4 Processing
              <span className="font-normal text-amber-200/70">· New listings, drafts and signatures are disabled.</span>
            </p>
            <Button size="sm" variant="outline" onClick={() => setLockedOut(false)}>Reopen trading (demo)</Button>
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
          <FeaturedOpportunities
            onView={(f) => {
              const match = listings.find((l) => l.teamId === f.teamId && l.type === f.type) ?? listings.find((l) => l.teamId === f.teamId)
              if (match) openListing(match)
            }}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4 lg:gap-6" aria-label="Market insights">
          <MyContracts contracts={contracts} viewerId={viewerId} onOpen={openContract} />
          <Leaderboard stats={hub.stats} viewerId={viewerId} />
          <ActivityFeed activity={hub.activity} />
          <MarketPulse listings={listings} />
          <Announcements />
          <TopPartners />
        </aside>
      </main>

      <NegotiationSheet
        listing={activeListing}
        threadId={session?.threadId ?? null}
        viewer={team}
        onSelectThread={(threadId) => setSession((s) => (s ? { ...s, threadId } : s))}
        onClose={() => setSession(null)}
      />
    </div>
  )
}
