"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import * as actions from "@/lib/actions/hub-actions"
import {
  fullRoster,
  setTeamRegistry,
  threadIdFor,
  type ActivityLog,
  type AiReview,
  type AnnouncementTag,
  type Contract,
  type FineReason,
  type HubSettings,
  type Listing,
  type Team,
} from "@/lib/domain"
import {
  EMPTY_SNAPSHOT,
  type ActionResult,
  type ContractDraft,
  type ContractOverride,
  type HubSnapshot,
  type MrOfferDraft,
  type NewListingInput,
  type RatingDraft,
} from "@/lib/hub-types"

export type { ContractDraft, ContractOverride, MrOfferDraft, NewListingInput, RatingDraft } from "@/lib/hub-types"

const POLL_MS = 4000

type Snapshot = Omit<HubSnapshot, "listings" | "activity"> & { listings: Listing[]; activity: ActivityLog[] }

interface HubValue extends Snapshot {
  loading: boolean
  refresh: () => Promise<unknown>
  teamById: Record<string, Team>
  bannedIds: string[]
  approvedIds: string[]
  certifiedIds: string[]
  platformFeesUSD: number
  isLive: boolean
  toggleLive: () => void
  lockedOut: boolean
  postListing: (input: NewListingInput) => Promise<boolean>
  openThread: (listing: Listing, viewerId: string) => string
  draftContract: (draft: ContractDraft, parentId?: string) => Promise<boolean>
  finalizeContract: (contractId: string) => Promise<Contract | null>
  rejectAndClose: (threadId: string) => Promise<boolean>
  proposeMr: (draft: MrOfferDraft) => Promise<boolean>
  respondMr: (offerId: string, accept: boolean) => Promise<boolean>
  submitRating: (draft: RatingDraft) => Promise<boolean>
  signWaiver: (signatoryName: string) => Promise<boolean>
  setCalendar: (period: string, deadlineAt: number | null) => Promise<boolean>
  recordAiReview: (contractId: string, review: AiReview) => void
  adminApprove: (contractId: string) => Promise<boolean>
  adminDelete: (contractId: string) => Promise<boolean>
  adminOverride: (contractId: string, patch: ContractOverride) => Promise<boolean>
  deleteListing: (listingId: string) => Promise<boolean>
  toggleBan: (teamId: string) => Promise<boolean>
  approveKyc: (teamId: string) => Promise<boolean>
  rejectKyc: (teamId: string) => Promise<boolean>
  issueFine: (teamId: string, amountK: number, reason: FineReason) => Promise<boolean>
  setTeamEquity: (teamId: string, equityK: number | null) => Promise<boolean>
  updateSettings: (patch: Partial<HubSettings>) => Promise<boolean>
  postAnnouncement: (tag: AnnouncementTag, title: string, body: string) => Promise<boolean>
  deleteAnnouncement: (id: string) => Promise<boolean>
}

const HubContext = createContext<HubValue | null>(null)

export function HubProvider({ children, initial }: { children: ReactNode; initial?: HubSnapshot }) {
  const [isLive, setIsLive] = useState(true)
  const seen = useRef<Set<string> | null>(null)

  const { data, isLoading, mutate } = useSWR("hub-snapshot", () => actions.getSnapshot(), {
    fallbackData: initial,
    refreshInterval: isLive ? POLL_MS : 0,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const raw = data ?? EMPTY_SNAPSHOT
  const teams = useMemo(() => fullRoster(raw.teams), [raw.teams])
  const snapshot = useMemo(() => ({ ...raw, teams }), [raw, teams])
  setTeamRegistry(teams)

  /** Rows that appeared since the previous poll get a one-time highlight. */
  const { listings, activity } = useMemo(() => {
    const prev = seen.current
    const next = new Set<string>()
    const mark = <T extends { id: string }>(rows: T[]) =>
      rows.map((r) => {
        next.add(r.id)
        return prev && !prev.has(r.id) ? { ...r, isNew: true } : r
      })
    const result = { listings: mark(snapshot.listings), activity: mark(snapshot.activity) }
    seen.current = next
    return result
  }, [snapshot.listings, snapshot.activity])

  const run = useCallback(
    async <T,>(call: () => Promise<ActionResult<T>>): Promise<T | null> => {
      try {
        const result = await call()
        if (!result.ok) {
          toast.error(result.error)
          return null
        }
        await mutate()
        return result.data
      } catch {
        toast.error("Network error. Please try again.")
        return null
      }
    },
    [mutate],
  )
  const done = useCallback(async (p: Promise<unknown>) => (await p) !== null, [])

  const openThread = useCallback(
    (listing: Listing, viewerId: string) => {
      const id = threadIdFor(listing.id, viewerId, listing.teamId)
      if (!snapshot.threads[id]) void run(() => actions.openThread(listing.id))
      return id
    },
    [run, snapshot.threads],
  )

  const value = useMemo<HubValue>(() => {
    const teamById = Object.fromEntries(snapshot.teams.map((t) => [t.id, t]))
    return {
      ...snapshot,
      listings,
      activity,
      loading: isLoading && !data,
      refresh: () => mutate(),
      teamById,
      bannedIds: snapshot.teams.filter((t) => t.banned).map((t) => t.id),
      approvedIds: snapshot.teams.filter((t) => t.kyc === "approved").map((t) => t.id),
      certifiedIds: snapshot.teams.filter((t) => t.certified).map((t) => t.id),
      platformFeesUSD: Object.values(snapshot.aiReviews).reduce((sum, r) => sum + r.feeUSD, 0),
      isLive,
      toggleLive: () => setIsLive((v) => !v),
      lockedOut: snapshot.settings.tradingLocked,
      postListing: (input) => done(run(() => actions.postListing(input))),
      openThread,
      draftContract: (draft, parentId) => done(run(() => actions.draftContract(draft, parentId))),
      finalizeContract: (id) => run(() => actions.finalizeContract(id)),
      rejectAndClose: (threadId) => done(run(() => actions.rejectAndClose(threadId))),
      proposeMr: (draft) => done(run(() => actions.proposeMr(draft))),
      respondMr: (offerId, accept) => done(run(() => actions.respondMr(offerId, accept))),
      submitRating: (draft) => done(run(() => actions.submitRating(draft))),
      signWaiver: (name) => done(run(() => actions.signWaiver(name))),
      setCalendar: (period, deadlineAt) => done(run(() => actions.setCalendar(period, deadlineAt))),
      recordAiReview: (contractId, review) => {
        if (!snapshot.aiReviews[contractId]) void run(() => actions.recordAiReview(contractId, review))
      },
      adminApprove: (id) => done(run(() => actions.adminApprove(id))),
      adminDelete: (id) => done(run(() => actions.adminDelete(id))),
      adminOverride: (id, patch) => done(run(() => actions.adminOverride(id, patch))),
      deleteListing: (id) => done(run(() => actions.deleteListing(id))),
      toggleBan: (teamId) => done(run(() => actions.toggleBan(teamId))),
      approveKyc: (teamId) => done(run(() => actions.approveKyc(teamId))),
      rejectKyc: (teamId) => done(run(() => actions.rejectKyc(teamId))),
      issueFine: (teamId, amountK, reason) => done(run(() => actions.issueFine(teamId, amountK, reason))),
      setTeamEquity: (teamId, equityK) => done(run(() => actions.setTeamEquity(teamId, equityK))),
      updateSettings: (patch) => done(run(() => actions.updateSettings(patch))),
      postAnnouncement: (tag, title, body) => done(run(() => actions.postAnnouncement(tag, title, body))),
      deleteAnnouncement: (id) => done(run(() => actions.deleteAnnouncement(id))),
    }
  }, [activity, data, done, isLive, isLoading, listings, mutate, openThread, run, snapshot])

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>
}

export function useHub() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error("useHub must be used within HubProvider")
  return ctx
}
