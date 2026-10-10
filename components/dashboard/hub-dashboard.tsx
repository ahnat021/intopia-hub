"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { useLiveMarket, type NewListingInput } from "@/hooks/use-live-market"
import { TEAMS, teamLabel, type FeaturedOpportunity, type Listing } from "@/lib/mock-data"
import { ContactSheet } from "./contact-sheet"
import { FeaturedOpportunities } from "./featured-opportunities"
import { LiveMarketplace, MarketplaceSkeleton } from "./live-marketplace"
import { MetricsStrip } from "./metrics-strip"
import { ActivityFeed, Announcements, Leaderboard, TopPartners } from "./sidebar-widgets"

export function HubDashboard() {
  const { listings, activity, isLive, setIsLive, pushListing, pushActivity } = useLiveMarket()
  const [contactListing, setContactListing] = useState<Listing | null>(null)

  const metrics = useMemo(() => {
    let openListings = 0
    let partnerships = 0
    let rnd = 0
    for (const l of listings) {
      if (l.status === "CLOSED") continue
      if (l.type === "BUY" || l.type === "SELL") openListings++
      else if (l.type === "PARTNERSHIP") partnerships++
      else rnd++
    }
    return { openListings, teams: TEAMS.length, partnerships, rnd }
  }, [listings])

  const handlePost = useCallback(
    (input: NewListingInput) => {
      const listing = pushListing(input)
      pushActivity("listing", `${teamLabel(listing.teamId)} posted ${listing.product}`)
      toast.success("Listing published", { description: `${listing.product} · ${listing.quantity}` })
    },
    [pushListing, pushActivity],
  )

  const handleFeatured = useCallback(
    (f: FeaturedOpportunity) => {
      const match = listings.find((l) => l.teamId === f.teamId && l.type === f.type && l.status !== "CLOSED")
      setContactListing(
        match ?? {
          id: f.id,
          status: "OPEN",
          type: f.type,
          teamId: f.teamId,
          product: f.title,
          quantity: f.value,
          region: "Global",
          neededBy: "P5",
          notes: f.description,
          createdAt: 0,
        },
      )
    },
    [listings],
  )

  const toggleLive = useCallback(() => setIsLive((v) => !v), [setIsLive])

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <MetricsStrip data={metrics} />

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8 xl:col-span-9">
          <Suspense fallback={<MarketplaceSkeleton />}>
            <LiveMarketplace
              listings={listings}
              isLive={isLive}
              onToggleLive={toggleLive}
              onPost={handlePost}
              onContact={setContactListing}
            />
          </Suspense>
          <FeaturedOpportunities onView={handleFeatured} />
        </div>

        <aside aria-label="Market insights" className="flex min-w-0 flex-col gap-4 lg:col-span-4 xl:col-span-3">
          <ActivityFeed activity={activity} />
          <Announcements />
          <Leaderboard />
          <TopPartners />
        </aside>
      </div>

      <ContactSheet listing={contactListing} onOpenChange={(open) => !open && setContactListing(null)} />
    </>
  )
}
