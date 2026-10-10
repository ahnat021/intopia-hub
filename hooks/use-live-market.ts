"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  INITIAL_ACTIVITY,
  INITIAL_LISTINGS,
  LIVE_TEMPLATES,
  REGIONS,
  SIM_START_SECONDS,
  TEAMS,
  teamLabel,
  type ActivityKind,
  type ActivityLog,
  type Listing,
  type ListingType,
} from "@/lib/mock-data"

const TICK_MS = 8000
const MAX_LISTINGS = 120
const MAX_ACTIVITY = 30

const LIVE_TYPES: ListingType[] = ["BUY", "SELL", "PARTNERSHIP", "BUY", "RND", "SELL"]

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

export type NewListingInput = Omit<Listing, "id" | "createdAt" | "status" | "isNew">

/**
 * Simulates a WebSocket feed: periodically pushes new listings and activity
 * events into local state, as a real-time backend subscription would.
 */
export function useLiveMarket() {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS)
  const [activity, setActivity] = useState<ActivityLog[]>(INITIAL_ACTIVITY)
  const [isLive, setIsLive] = useState(true)
  const mountedAt = useRef<number | null>(null)
  const seq = useRef(0)

  const simNow = useCallback(() => {
    if (mountedAt.current === null) mountedAt.current = Date.now()
    return SIM_START_SECONDS + Math.floor((Date.now() - mountedAt.current) / 1000)
  }, [])

  const pushActivity = useCallback(
    (kind: ActivityKind, message: string) => {
      const entry: ActivityLog = { id: `A-live-${++seq.current}`, kind, message, at: simNow(), isNew: true }
      setActivity((prev) => [entry, ...prev.map((a) => (a.isNew ? { ...a, isNew: false } : a))].slice(0, MAX_ACTIVITY))
    },
    [simNow],
  )

  const pushListing = useCallback(
    (input: NewListingInput) => {
      const listing: Listing = {
        ...input,
        id: `L-${2000 + ++seq.current}`,
        status: "OPEN",
        createdAt: simNow(),
        isNew: true,
      }
      setListings((prev) =>
        [listing, ...prev.map((l) => (l.isNew ? { ...l, isNew: false } : l))].slice(0, MAX_LISTINGS),
      )
      return listing
    },
    [simNow],
  )

  useEffect(() => {
    simNow()
    if (!isLive) return

    let tick = 0
    const id = setInterval(() => {
      tick++
      const team = pick(TEAMS)

      if (tick % 2 === 1) {
        const type = pick(LIVE_TYPES)
        const template = pick(LIVE_TEMPLATES[type])
        pushListing({
          type,
          teamId: team.id,
          product: template.product,
          quantity: template.quantity,
          region: pick(REGIONS),
          neededBy: pick(["P5", "P6"]),
          notes: template.notes,
        })
        pushActivity(
          type === "PARTNERSHIP" ? "partnership" : type === "RND" ? "license" : "listing",
          `${teamLabel(team.id)} posted ${template.product}`,
        )
      } else {
        const counterparty = pick(TEAMS.filter((t) => t.id !== team.id))
        const qty = (Math.floor(Math.random() * 8) + 2) * 500
        pushActivity("deal", `${teamLabel(team.id)} and ${teamLabel(counterparty.id)} closed a ${qty.toLocaleString("en-US")}-unit deal`)
        setListings((prev) => {
          const idx = prev.findIndex((l) => l.status === "OPEN" && !l.isNew)
          if (idx === -1) return prev
          const next = prev.slice()
          next[idx] = { ...next[idx], status: "NEGOTIATING" }
          return next
        })
      }
    }, TICK_MS)

    return () => clearInterval(id)
  }, [isLive, pushActivity, pushListing, simNow])

  return { listings, activity, isLive, setIsLive, pushListing, pushActivity }
}
