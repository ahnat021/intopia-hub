"use client"

import { useCallback, useMemo, useState } from "react"
import { BadgeCheck, BookUser, Compass, FileSignature, Lock, MessagesSquare, Store, UserCog } from "lucide-react"
import { toast } from "sonner"
import { ProfessorConsole } from "./professor-console"
import { OnboardingTour, useFirstVisitTour } from "./onboarding-tour"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { isBankrupt, isProfessor, type Contract, type Listing } from "@/lib/domain"
import { CLEARING_FEE_LABEL, type MrCatalogItem } from "@/lib/constants"
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
import { OnboardingGate } from "@/components/hub/onboarding-gate"
import { VisibilityPill } from "@/components/hub/visibility-pill"
import { ObligationsTracker } from "@/components/hub/obligations-tracker"
import { ChatWorkspace } from "@/components/hub/chat-workspace"
import { CohortLogbook } from "@/components/hub/cohort-logbook"
import { MrCatalog } from "@/components/hub/mr-catalog"
import { FeeSummary } from "@/components/hub/fee-summary"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Workspace = "market" | "contracts" | "chat" | "logbook"

const WORKSPACES: { id: Workspace; label: string; hint: string; icon: typeof Store }[] = [
  { id: "market", label: "Marketplace", hint: "Browse open Buy, Sell & Other offers from all teams and post your own.", icon: Store },
  { id: "contracts", label: "My Contracts", hint: "Your executed contracts, delivery obligations, payment schedules and PDF exports.", icon: FileSignature },
  { id: "chat", label: "Negotiations & Chat", hint: "Message any team privately, share files up to 2 MB, and rate counterparties.", icon: MessagesSquare },
  { id: "logbook", label: "Logbook & Tools", hint: "Team directory, official schedule, and Datalog freight & production calculator.", icon: BookUser },
]

export function HubDashboard() {
  const { team, signOut } = useAuth()
  const hub = useHub()
  const { listings, threads, contracts, lockedOut, openThread, postListing, settings } = hub
  const [session, setSession] = useState<{ listingId: string; threadId: string | null } | null>(null)
  const [tourOpen, setTourOpen] = useFirstVisitTour()
  const [workspace, setWorkspace] = useState<Workspace>("market")
  const [chatPartner, setChatPartner] = useState<string | null>(null)
  const [editProfile, setEditProfile] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const viewerId = team!.id
  const signed = hub.certifiedIds.includes(viewerId)
  const me = hub.teamById[viewerId] ?? team!
  const needsOnboarding = !onboarded && (!signed || !(me.team_members?.length ?? 0))
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
      partnerships: active.filter((l) => l.type === "OTHER" || l.type === "PARTNERSHIP").length,
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

  const messageTeam = useCallback((id: string) => {
    setChatPartner(id)
    setWorkspace("chat")
  }, [])

  const syndicate = useCallback(
    async (item: MrCatalogItem) => {
      const ok = await postListing({
        teamId: viewerId,
        type: "OTHER",
        title: `MR cost-split: #${item.id} ${item.title}`,
        product: "X",
        grade: 0,
        quantity: 1,
        unitPrice: Math.round(item.costUSD / 2),
        region: "North America",
        delivery: null,
        notes: `Seeking a partner to split the $${item.costUSD.toLocaleString("en-CA")} cost of Market Research item #${item.id} (${item.category}).`,
      } as Parameters<typeof postListing>[0])
      if (ok) toast.success("Syndication offer posted to the marketplace.")
    },
    [postListing, viewerId],
  )

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
        <Button variant="ghost" size="sm" onClick={() => setEditProfile(true)}>
          <UserCog aria-hidden />
          <span className="hidden md:inline">Edit Team Profile</span>
          <span className="sr-only md:hidden">Edit Team Profile</span>
        </Button>
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

      <Tabs value={workspace} onValueChange={(v) => setWorkspace(v as Workspace)} className="mx-auto max-w-[1440px] gap-0 px-4 pt-6 sm:px-6 lg:px-8">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-auto" aria-label="Workspaces">
          {WORKSPACES.map((w) => (
            <Tooltip key={w.id}>
              <TooltipTrigger asChild>
                <TabsTrigger value={w.id} className="gap-2 px-3 py-2">
                  <w.icon className="size-4" aria-hidden />
                  {w.label}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{w.hint}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
        <p className="mt-2 text-xs text-muted-foreground">{WORKSPACES.find((w) => w.id === workspace)?.hint}</p>

        <TabsContent value="market" className="mt-4">
          <div className="grid gap-4 pb-8 lg:grid-cols-12 lg:gap-6">
            <MetricsStrip data={metrics} />
            <div className="flex min-w-0 flex-col gap-4 lg:col-span-8 lg:gap-6">
              <div role="note" className="glass-card flex flex-col gap-3 rounded-lg border border-gold/50 p-4 text-sm leading-relaxed">
                <p>
                  <strong className="font-serif text-gold">Market Liquidity Mandate.</strong> Every trade executed on Intopia Hub is escrow-protected and carries an{" "}
                  {CLEARING_FEE_LABEL}, split evenly between buyer and seller.
                </p>
                <FeeSummary />
              </div>
              <VisibilityPill scope="public" />
              <LiveMarketplace
                listings={listings}
                viewerId={viewerId}
                contractListingIds={contractListingIds}
                isLive={hub.isLive}
                onToggleLive={hub.toggleLive}
                onOpen={openListing}
              />
              <MrCatalog onSyndicate={syndicate} disabled={lockedOut || !signed} />
            </div>
            <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4 lg:gap-6" aria-label="Market insights">
              <Announcements announcements={hub.announcements} />
              <Leaderboard stats={hub.stats} viewerId={viewerId} />
              <ActivityFeed activity={hub.activity} />
              <MarketPulse listings={listings} />
              <TopPartners contracts={contracts} />
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4 pb-8">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <ObligationsTracker contracts={contracts} viewerId={viewerId} teamById={hub.teamById} />
            </div>
            <aside className="flex flex-col gap-4 lg:col-span-4" aria-label="Contract tools">
              <MyContracts contracts={contracts} viewerId={viewerId} onOpen={openContract} />
              <FreightTracker shipments={hub.shipments} viewerId={viewerId} />
              <PenaltyEstimator contracts={contracts} viewerId={viewerId} />
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-4 pb-8">
          <ChatWorkspace viewerId={viewerId} teams={hub.teams} partnerId={chatPartner} onPartnerChange={setChatPartner} />
        </TabsContent>

        <TabsContent value="logbook" className="mt-4 pb-8">
          <CohortLogbook teams={hub.teams} viewerId={viewerId} onMessage={messageTeam} />
        </TabsContent>
      </Tabs>

      <NegotiationSheet
        listing={activeListing}
        threadId={session?.threadId ?? null}
        viewer={team}
        onSelectThread={(threadId) => setSession((s) => (s ? { ...s, threadId } : s))}
        onClose={() => setSession(null)}
      />
      <OnboardingTour open={tourOpen && !needsOnboarding} onOpenChange={setTourOpen} />
      <OnboardingGate
        key="onboard"
        team={me}
        open={needsOnboarding}
        signed={signed}
        onSign={hub.signWaiver}
        onDone={() => {
          setOnboarded(true)
          void hub.refresh()
        }}
      />
      {editProfile && (
        <OnboardingGate
          key="edit"
          team={me}
          mode="edit"
          open
          signed
          onSign={hub.signWaiver}
          onOpenChange={setEditProfile}
          onDone={() => {
            setEditProfile(false)
            void hub.refresh()
          }}
        />
      )}
    </div>
  )
}
