"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { OPERATING_AREAS, PRODUCT_INFO, formatCompactUSD, formatUnits, productCode } from "@/lib/intopia-rules"
import {
  ACTIVE_TEAMS,
  INITIAL_ACTIVITY,
  INITIAL_CONTRACTS,
  INITIAL_LISTINGS,
  INITIAL_MESSAGES,
  INITIAL_MR_OFFERS,
  INITIAL_RATINGS,
  INITIAL_SHIPMENTS,
  INITIAL_STATS,
  INITIAL_THREADS,
  LIVE_SEED,
  MR_ITEMS,
  SIM_START_SECONDS,
  teamLabel,
  threadIdFor,
  type ActivityKind,
  type ActivityLog,
  type ChatMessage,
  type Contract,
  type Listing,
  type ListingType,
  type MrOffer,
  type Rating,
  type Shipment,
  type TeamStats,
  type Thread,
} from "@/lib/mock-data"

const TICK_MS = 9000
const MAX_LISTINGS = 140
const MAX_ACTIVITY = 40
const LIVE_TYPES: ListingType[] = ["BUY", "SELL", "PARTNERSHIP", "BUY", "RND", "SELL"]

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

export type NewListingInput = Omit<Listing, "id" | "createdAt" | "status" | "isNew">
export type ContractDraft = Omit<Contract, "id" | "status" | "createdAt" | "finalizedAt" | "parentId" | "revision" | "finalizedByAdmin" | "adminOverridden">
export type MrOfferDraft = Omit<MrOffer, "id" | "status" | "createdAt">
export type RatingDraft = Omit<Rating, "id" | "at">
export type ContractOverride = Pick<Contract, "quantity" | "unitPrice" | "totalValue" | "cashPct" | "ar1Pct" | "ar2Pct">

interface HubValue {
  listings: Listing[]
  activity: ActivityLog[]
  threads: Record<string, Thread>
  messages: ChatMessage[]
  contracts: Contract[]
  mrOffers: MrOffer[]
  ratings: Rating[]
  shipments: Shipment[]
  stats: Record<string, TeamStats>
  bannedIds: string[]
  isLive: boolean
  toggleLive: () => void
  lockedOut: boolean
  setLockedOut: (locked: boolean) => void
  postListing: (input: NewListingInput) => Listing
  openThread: (listing: Listing, viewerId: string) => string
  draftContract: (draft: ContractDraft, parentId?: string) => Contract
  finalizeContract: (contractId: string, signerId: string) => Contract | null
  rejectAndClose: (threadId: string, byId: string) => void
  proposeMr: (draft: MrOfferDraft) => MrOffer
  respondMr: (offerId: string, byId: string, accept: boolean) => void
  submitRating: (draft: RatingDraft) => void
  adminApprove: (contractId: string) => void
  adminDelete: (contractId: string) => void
  adminOverride: (contractId: string, patch: ContractOverride) => void
  toggleBan: (teamId: string) => void
  adminAuthed: boolean
  setAdminAuthed: (v: boolean) => void
}

const HubContext = createContext<HubValue | null>(null)

const otherParty = (c: Contract) => (c.providerId === c.initiatorId ? c.counterpartyId : c.initiatorId)

function describeDeal(c: Contract) {
  const [a, b] = [teamLabel(c.initiatorId), teamLabel(c.counterpartyId)]
  if (c.kind === "PRODUCT_SALE") return `${a} & ${b} closed a ${formatUnits(c.quantity)}-unit ${PRODUCT_INFO[c.product].name} deal`
  if (c.kind === "PATENT_LICENSE") return `${teamLabel(c.providerId)} licensed ${productCode(c.product, c.grade)} technology to ${teamLabel(otherParty(c))}`
  return `${teamLabel(c.providerId)} extended a ${formatCompactUSD(c.totalValue)} B2B loan to ${teamLabel(otherParty(c))}`
}

export function HubProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState(INITIAL_LISTINGS)
  const [activity, setActivity] = useState(INITIAL_ACTIVITY)
  const [threads, setThreads] = useState(INITIAL_THREADS)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS)
  const [mrOffers, setMrOffers] = useState(INITIAL_MR_OFFERS)
  const [ratings, setRatings] = useState(INITIAL_RATINGS)
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS)
  const [stats, setStats] = useState(INITIAL_STATS)
  const [bannedIds, setBannedIds] = useState<string[]>([])
  const [isLive, setIsLive] = useState(true)
  const [lockedOut, setLockedOut] = useState(false)
  const [adminAuthed, setAdminAuthed] = useState(false)
  const mountedAt = useRef<number | null>(null)
  const seq = useRef(0)

  const simNow = useCallback(() => {
    if (mountedAt.current === null) mountedAt.current = Date.now()
    return SIM_START_SECONDS + Math.floor((Date.now() - mountedAt.current) / 1000)
  }, [])

  const nextId = useCallback((prefix: string) => `${prefix}-${Date.now().toString(36)}-${++seq.current}`, [])

  const pushActivity = useCallback(
    (kind: ActivityKind, message: string) => {
      const entry: ActivityLog = { id: nextId("A"), kind, message, at: simNow(), isNew: true }
      setActivity((prev) => [entry, ...prev.map((a) => (a.isNew ? { ...a, isNew: false } : a))].slice(0, MAX_ACTIVITY))
    },
    [nextId, simNow],
  )

  const patchListing = useCallback((id: string, patch: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const patchContract = useCallback((id: string, patch: Partial<Contract>) => {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const addMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "at">) => {
      const at = simNow()
      setMessages((prev) => [...prev, { ...msg, id: nextId("M"), at }])
      setThreads((prev) => (prev[msg.threadId] ? { ...prev, [msg.threadId]: { ...prev[msg.threadId], updatedAt: at } } : prev))
    },
    [nextId, simNow],
  )

  const postListing = useCallback(
    (input: NewListingInput) => {
      const listing: Listing = { ...input, id: nextId("L"), status: "OPEN", createdAt: simNow(), isNew: true }
      setListings((prev) => [listing, ...prev.map((l) => (l.isNew ? { ...l, isNew: false } : l))].slice(0, MAX_LISTINGS))
      return listing
    },
    [nextId, simNow],
  )

  const openThread = useCallback(
    (listing: Listing, viewerId: string) => {
      const id = threadIdFor(listing.id, viewerId, listing.teamId)
      const isNewThread = !threads[id]
      if (isNewThread) {
        setThreads((prev) => ({ ...prev, [id]: { id, listingId: listing.id, teamIds: [viewerId, listing.teamId], updatedAt: simNow() } }))
        addMessage({ threadId: id, from: "system", text: `${teamLabel(viewerId)} opened a structured negotiation on this listing.` })
        if (listing.status === "OPEN") patchListing(listing.id, { status: "NEGOTIATING" })
      }
      return id
    },
    [addMessage, patchListing, simNow, threads],
  )

  const draftContract = useCallback(
    (draft: ContractDraft, parentId?: string) => {
      const parent = parentId ? contracts.find((c) => c.id === parentId) : undefined
      const revision = parent ? parent.revision + 1 : 1
      const contract: Contract = { ...draft, id: nextId("C"), status: "AWAITING", createdAt: simNow(), parentId, revision }
      setContracts((prev) => [...prev.map((c) => (c.id === parentId ? { ...c, status: "COUNTERED" as const } : c)), contract])
      addMessage({
        threadId: draft.threadId,
        from: draft.initiatorId,
        text: parent ? `Counter-offer R${revision} submitted, replacing R${parent.revision}.` : `Proposal R${revision} submitted for signature.`,
        contractId: contract.id,
      })
      patchListing(draft.listingId, { status: "PENDING_SIGNATURE" })
      pushActivity("contract", `${teamLabel(draft.initiatorId)} sent ${teamLabel(draft.counterpartyId)} a ${parent ? "counter-offer" : "contract"} for signature`)
      return contract
    },
    [addMessage, contracts, nextId, patchListing, pushActivity, simNow],
  )

  const applyFinalize = useCallback(
    (contract: Contract, byAdmin: boolean) => {
      const finalized: Contract = { ...contract, status: "FINALIZED", finalizedAt: simNow(), finalizedByAdmin: byAdmin || undefined }
      setContracts((prev) => prev.map((c) => (c.id === contract.id ? finalized : c)))
      patchListing(contract.listingId, { status: "CLOSED" })
      addMessage({
        threadId: contract.threadId,
        from: "system",
        text: byAdmin ? `Contract ${contract.id} was force-approved by the Hub Administrator.` : `Contract ${contract.id} officially finalized & locked by both teams.`,
      })
      pushActivity(contract.kind === "PATENT_LICENSE" ? "license" : "deal", describeDeal(contract))
      if (contract.kind === "PRODUCT_SALE" && contract.delivery) {
        const delivery = contract.delivery
        setShipments((prev) => [
          {
            id: nextId("S"),
            contractId: contract.id,
            sellerId: contract.providerId,
            buyerId: otherParty(contract),
            product: contract.product,
            grade: contract.grade,
            quantity: contract.quantity,
            mode: delivery,
            region: contract.region,
          },
          ...prev,
        ])
      }
      setStats((prev) => {
        const next = { ...prev }
        for (const id of [contract.initiatorId, contract.counterpartyId]) {
          const s = next[id]
          if (s) next[id] = { ...s, completed: s.completed + 1, reputation: Math.min(100, s.reputation + 1) }
        }
        return next
      })
      return finalized
    },
    [addMessage, nextId, patchListing, pushActivity, simNow],
  )

  const finalizeContract = useCallback(
    (contractId: string, signerId: string) => {
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract || lockedOut || contract.status !== "AWAITING" || contract.counterpartyId !== signerId) return null
      return applyFinalize(contract, false)
    },
    [applyFinalize, contracts, lockedOut],
  )

  const rejectAndClose = useCallback(
    (threadId: string, byId: string) => {
      const thread = threads[threadId]
      if (!thread || thread.closed) return
      setContracts((prev) => prev.map((c) => (c.threadId === threadId && c.status === "AWAITING" ? { ...c, status: "REJECTED" as const } : c)))
      setMrOffers((prev) => prev.map((o) => (o.threadId === threadId && o.status === "OFFERED" ? { ...o, status: "DECLINED" as const } : o)))
      setThreads((prev) => ({ ...prev, [threadId]: { ...prev[threadId], closed: true } }))
      addMessage({ threadId, from: "system", text: `${teamLabel(byId)} rejected the open terms and closed this negotiation.` })
      const otherLive = Object.values(threads).some((t) => t.listingId === thread.listingId && t.id !== threadId && !t.closed)
      setListings((prev) => prev.map((l) => (l.id === thread.listingId && l.status !== "CLOSED" ? { ...l, status: otherLive ? "NEGOTIATING" : "OPEN" } : l)))
    },
    [addMessage, threads],
  )

  const proposeMr = useCallback(
    (draft: MrOfferDraft) => {
      const offer: MrOffer = { ...draft, id: nextId("MR"), status: "OFFERED", createdAt: simNow() }
      setMrOffers((prev) => [...prev, offer])
      const item = MR_ITEMS.find((i) => i.id === draft.itemId)
      addMessage({ threadId: draft.threadId, from: draft.sellerId, text: `Market research offer: ${item?.label ?? "MR item"} for ${draft.area}.`, mrOfferId: offer.id })
      return offer
    },
    [addMessage, nextId, simNow],
  )

  const respondMr = useCallback(
    (offerId: string, byId: string, accept: boolean) => {
      const offer = mrOffers.find((o) => o.id === offerId)
      if (!offer || offer.status !== "OFFERED" || offer.buyerId !== byId) return
      setMrOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: accept ? "ACCEPTED" : "DECLINED" } : o)))
      const item = MR_ITEMS.find((i) => i.id === offer.itemId)
      addMessage({
        threadId: offer.threadId,
        from: "system",
        text: accept
          ? `${teamLabel(byId)} accepted ${item?.label}. Settle via a service payment of ${formatCompactUSD(offer.priceK * 1000)} in the simulation.`
          : `${teamLabel(byId)} declined the market research offer.`,
      })
      if (accept) pushActivity("deal", `${teamLabel(offer.sellerId)} shared ${item?.label} with ${teamLabel(offer.buyerId)}`)
    },
    [addMessage, mrOffers, pushActivity],
  )

  const submitRating = useCallback(
    (draft: RatingDraft) => {
      if (ratings.some((r) => r.contractId === draft.contractId && r.fromId === draft.fromId)) return
      setRatings((prev) => [...prev, { ...draft, id: nextId("R"), at: simNow() }])
      setStats((prev) => {
        const s = prev[draft.toId]
        if (!s) return prev
        const tagCounts = { ...s.tagCounts }
        for (const t of draft.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1
        return {
          ...prev,
          [draft.toId]: {
            ...s,
            ratingTotal: s.ratingTotal + draft.stars,
            ratingCount: s.ratingCount + 1,
            tagCounts,
            reputation: Math.max(0, Math.min(100, s.reputation + (draft.stars - 3))),
          },
        }
      })
    },
    [nextId, ratings, simNow],
  )

  const adminApprove = useCallback(
    (contractId: string) => {
      const contract = contracts.find((c) => c.id === contractId)
      if (contract && contract.status !== "FINALIZED") applyFinalize(contract, true)
    },
    [applyFinalize, contracts],
  )

  const adminDelete = useCallback(
    (contractId: string) => {
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract) return
      setContracts((prev) => prev.filter((c) => c.id !== contractId))
      setMessages((prev) => prev.filter((m) => m.contractId !== contractId))
      setShipments((prev) => prev.filter((s) => s.contractId !== contractId))
      addMessage({ threadId: contract.threadId, from: "system", text: `Contract ${contract.id} was removed by the Hub Administrator.` })
      if (contract.status === "FINALIZED" || contract.status === "AWAITING") patchListing(contract.listingId, { status: "NEGOTIATING" })
    },
    [addMessage, contracts, patchListing],
  )

  const adminOverride = useCallback(
    (contractId: string, patch: ContractOverride) => {
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract) return
      patchContract(contractId, { ...patch, adminOverridden: true })
      addMessage({ threadId: contract.threadId, from: "system", text: `Terms of ${contract.id} were overridden by the Hub Administrator.` })
    },
    [addMessage, contracts, patchContract],
  )

  const toggleBan = useCallback(
    (teamId: string) => {
      setBannedIds((prev) => {
        const banned = prev.includes(teamId)
        pushActivity("announcement", banned ? `${teamLabel(teamId)} was reinstated by the Hub Administrator` : `${teamLabel(teamId)} was removed from the hub`)
        return banned ? prev.filter((id) => id !== teamId) : [...prev, teamId]
      })
    },
    [pushActivity],
  )

  useEffect(() => {
    simNow()
  }, [simNow])

  useEffect(() => {
    if (!isLive || lockedOut) return
    let tick = 0
    const id = setInterval(() => {
      tick++
      const pool = ACTIVE_TEAMS.filter((t) => !bannedIds.includes(t.id))
      const team = pick(pool)
      if (tick % 2 === 1) {
        const type = pick(LIVE_TYPES)
        const seed = 60 + Math.floor(Math.random() * 400)
        const generated = LIVE_SEED.buildListing(type, seed, seed, false)
        const { id: _id, createdAt: _c, status: _s, ...input } = generated
        const listing = postListing({ ...input, teamId: team.id })
        pushActivity(type === "PARTNERSHIP" ? "partnership" : type === "RND" ? "license" : "listing", `${teamLabel(team.id)} posted ${listing.title}`)
      } else {
        const other = pick(pool.filter((t) => t.id !== team.id))
        const qty = (Math.floor(Math.random() * 14) + 2) * 500
        pushActivity("deal", `${teamLabel(team.id)} & ${teamLabel(other.id)} closed a ${qty.toLocaleString("en-US")}-unit ${pick(["Product X", "Product Y"])} deal in ${pick(OPERATING_AREAS)}`)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [bannedIds, isLive, lockedOut, postListing, pushActivity])

  const toggleLive = useCallback(() => setIsLive((v) => !v), [])

  const value = useMemo<HubValue>(
    () => ({
      listings, activity, threads, messages, contracts, mrOffers, ratings, shipments, stats, bannedIds,
      isLive, toggleLive, lockedOut, setLockedOut,
      postListing, openThread, draftContract, finalizeContract, rejectAndClose, proposeMr, respondMr, submitRating,
      adminApprove, adminDelete, adminOverride, toggleBan, adminAuthed, setAdminAuthed,
    }),
    [
      listings, activity, threads, messages, contracts, mrOffers, ratings, shipments, stats, bannedIds,
      isLive, toggleLive, lockedOut,
      postListing, openThread, draftContract, finalizeContract, rejectAndClose, proposeMr, respondMr, submitRating,
      adminApprove, adminDelete, adminOverride, toggleBan, adminAuthed,
    ],
  )

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>
}

export function useHub() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error("useHub must be used within HubProvider")
  return ctx
}
