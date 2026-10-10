"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { OPERATING_AREAS, PRODUCT_INFO, formatCompactUSD, formatUnits, productCode } from "@/lib/intopia-rules"
import {
  ACTIVE_TEAMS,
  INITIAL_ACTIVITY,
  INITIAL_CONTRACTS,
  INITIAL_LISTINGS,
  INITIAL_MESSAGES,
  INITIAL_SHIPMENTS,
  INITIAL_STATS,
  INITIAL_THREADS,
  LIVE_SEED,
  SIM_START_SECONDS,
  teamLabel,
  threadIdFor,
  type ActivityKind,
  type ActivityLog,
  type ChatMessage,
  type Contract,
  type Listing,
  type ListingType,
  type Shipment,
  type TeamStats,
  type Thread,
} from "@/lib/mock-data"

const TICK_MS = 9000
const MAX_LISTINGS = 140
const MAX_ACTIVITY = 40
const LIVE_TYPES: ListingType[] = ["BUY", "SELL", "PARTNERSHIP", "BUY", "RND", "SELL"]

const REPLIES = [
  "Understood — let me check with our production lead.",
  "That works for us. Can you put it in a formal contract?",
  "Could you improve the A/R terms? We'd prefer more cash up front.",
  "We can hold this offer until 8:15 PM.",
  "Agreed on price. Remember surface lands in P5 — is that OK?",
]

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

export type NewListingInput = Omit<Listing, "id" | "createdAt" | "status" | "isNew">
export type ContractDraft = Omit<Contract, "id" | "status" | "createdAt" | "finalizedAt">

interface HubValue {
  listings: Listing[]
  activity: ActivityLog[]
  threads: Record<string, Thread>
  messages: ChatMessage[]
  contracts: Contract[]
  shipments: Shipment[]
  stats: Record<string, TeamStats>
  isLive: boolean
  toggleLive: () => void
  lockedOut: boolean
  setLockedOut: (locked: boolean) => void
  postListing: (input: NewListingInput) => Listing
  openThread: (listing: Listing, viewerId: string) => string
  sendMessage: (threadId: string, from: string, text: string) => void
  draftContract: (draft: ContractDraft) => Contract
  finalizeContract: (contractId: string, signerId: string) => Contract | null
}

const HubContext = createContext<HubValue | null>(null)

function describeDeal(c: Contract) {
  const [a, b] = [teamLabel(c.initiatorId), teamLabel(c.counterpartyId)]
  if (c.kind === "PRODUCT_SALE")
    return `${a} & ${b} closed a ${formatUnits(c.quantity)}-unit ${PRODUCT_INFO[c.product].name} deal`
  if (c.kind === "PATENT_LICENSE")
    return `${teamLabel(c.providerId)} licensed ${productCode(c.product, c.grade)} technology to ${teamLabel(c.providerId === c.initiatorId ? c.counterpartyId : c.initiatorId)}`
  return `${teamLabel(c.providerId)} extended a ${formatCompactUSD(c.totalValue)} B2B loan to ${teamLabel(c.providerId === c.initiatorId ? c.counterpartyId : c.initiatorId)}`
}

export function HubProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState(INITIAL_LISTINGS)
  const [activity, setActivity] = useState(INITIAL_ACTIVITY)
  const [threads, setThreads] = useState(INITIAL_THREADS)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS)
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS)
  const [stats, setStats] = useState(INITIAL_STATS)
  const [isLive, setIsLive] = useState(true)
  const [lockedOut, setLockedOut] = useState(false)
  const mountedAt = useRef<number | null>(null)
  const seq = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

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
      setThreads((prev) => {
        if (prev[id]) return prev
        return { ...prev, [id]: { id, listingId: listing.id, teamIds: [viewerId, listing.teamId], updatedAt: simNow() } }
      })
      setMessages((prev) => {
        if (prev.some((m) => m.threadId === id)) return prev
        return [
          ...prev,
          {
            id: nextId("M"),
            threadId: id,
            from: listing.teamId,
            text: `Thanks for reaching out about "${listing.title}". ${listing.notes}. What terms are you proposing?`,
            at: simNow(),
          },
        ]
      })
      if (listing.status === "OPEN") patchListing(listing.id, { status: "NEGOTIATING" })
      return id
    },
    [nextId, patchListing, simNow],
  )

  const sendMessage = useCallback(
    (threadId: string, from: string, text: string) => {
      addMessage({ threadId, from, text })
      const thread = threads[threadId]
      const other = thread?.teamIds.find((t) => t !== from)
      if (!other) return
      timers.current.push(setTimeout(() => addMessage({ threadId, from: other, text: pick(REPLIES) }), 1600))
    },
    [addMessage, threads],
  )

  const draftContract = useCallback(
    (draft: ContractDraft) => {
      const contract: Contract = { ...draft, id: nextId("C"), status: "AWAITING", createdAt: simNow() }
      setContracts((prev) => [...prev, contract])
      addMessage({ threadId: draft.threadId, from: draft.initiatorId, text: "Formal trade contract submitted for signature.", contractId: contract.id })
      patchListing(draft.listingId, { status: "PENDING_SIGNATURE" })
      pushActivity("contract", `${teamLabel(draft.initiatorId)} sent ${teamLabel(draft.counterpartyId)} a contract for signature`)
      return contract
    },
    [addMessage, nextId, patchListing, pushActivity, simNow],
  )

  const finalizeContract = useCallback(
    (contractId: string, signerId: string) => {
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract || lockedOut || contract.status === "FINALIZED" || contract.counterpartyId !== signerId) return null
      const finalized: Contract = { ...contract, status: "FINALIZED", finalizedAt: simNow() }
      setContracts((prev) => prev.map((c) => (c.id === contractId ? finalized : c)))
      patchListing(contract.listingId, { status: "CLOSED" })
      addMessage({ threadId: contract.threadId, from: "system", text: `Contract ${contract.id} officially finalized & locked by both teams.` })
      pushActivity(contract.kind === "PATENT_LICENSE" ? "license" : "deal", describeDeal(contract))
      if (contract.kind === "PRODUCT_SALE" && contract.delivery) {
        const buyerId = contract.providerId === contract.initiatorId ? contract.counterpartyId : contract.initiatorId
        setShipments((prev) => [
          {
            id: nextId("S"),
            contractId,
            sellerId: contract.providerId,
            buyerId,
            product: contract.product,
            grade: contract.grade,
            quantity: contract.quantity,
            mode: contract.delivery!,
            region: contract.region,
          },
          ...prev,
        ])
      }
      setStats((prev) => {
        const next = { ...prev }
        for (const id of [contract.initiatorId, contract.counterpartyId]) {
          const s = next[id]
          if (s) next[id] = { ...s, completed: s.completed + 1, reputation: Math.min(100, s.reputation + 1), promptness: Math.min(5, Math.round((s.promptness + 0.1) * 10) / 10) }
        }
        return next
      })
      return finalized
    },
    [addMessage, contracts, lockedOut, nextId, patchListing, pushActivity, simNow],
  )

  useEffect(() => {
    simNow()
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [simNow])

  useEffect(() => {
    if (!isLive || lockedOut) return
    let tick = 0
    const id = setInterval(() => {
      tick++
      const team = pick(ACTIVE_TEAMS)
      if (tick % 2 === 1) {
        const type = pick(LIVE_TYPES)
        const seed = 60 + Math.floor(Math.random() * 400)
        const generated = LIVE_SEED.buildListing(type, seed, seed, false)
        const { id: _id, createdAt: _c, status: _s, ...input } = generated
        const listing = postListing({ ...input, teamId: team.id })
        pushActivity(
          type === "PARTNERSHIP" ? "partnership" : type === "RND" ? "license" : "listing",
          `${teamLabel(team.id)} posted ${listing.title}`,
        )
      } else {
        const other = pick(ACTIVE_TEAMS.filter((t) => t.id !== team.id))
        const qty = (Math.floor(Math.random() * 14) + 2) * 500
        pushActivity("deal", `${teamLabel(team.id)} & ${teamLabel(other.id)} closed a ${qty.toLocaleString("en-US")}-unit ${pick(["Product X", "Product Y"])} deal in ${pick(OPERATING_AREAS)}`)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [isLive, lockedOut, postListing, pushActivity])

  const toggleLive = useCallback(() => setIsLive((v) => !v), [])

  const value = useMemo<HubValue>(
    () => ({
      listings, activity, threads, messages, contracts, shipments, stats,
      isLive, toggleLive, lockedOut, setLockedOut,
      postListing, openThread, sendMessage, draftContract, finalizeContract,
    }),
    [listings, activity, threads, messages, contracts, shipments, stats, isLive, toggleLive, lockedOut, postListing, openThread, sendMessage, draftContract, finalizeContract],
  )

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>
}

export function useHub() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error("useHub must be used within HubProvider")
  return ctx
}
