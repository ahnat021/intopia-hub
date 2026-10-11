import type { DeliveryMode, ListingRegion, Product, Region } from "./intopia-rules"

export type { DeliveryMode, ListingRegion, Product, Region } from "./intopia-rules"

export type ListingType = "BUY" | "SELL" | "PARTNERSHIP" | "RND"
export type ListingStatus = "OPEN" | "NEGOTIATING" | "PENDING_SIGNATURE" | "CLOSED"
export type KycStatus = "unregistered" | "pending" | "approved" | "rejected"

export interface Team {
  id: string
  number: number
  name: string
  company: string | null
  region: Region | null
  /** Only exposed to signed-in teams. */
  whatsapp: string | null
  /** Only exposed to the admin. */
  email: string | null
  /** Consolidated equity in $K, set by the facilitator. Below zero means bankruptcy. */
  equity: number | null
  kyc: KycStatus
  certified: boolean
  banned: boolean
  registeredAt: number | null
}

export interface Listing {
  id: string
  status: ListingStatus
  type: ListingType
  teamId: string
  title: string
  product: Product
  grade: number
  /** Thousands of units; null for partnerships / licensing. */
  quantity: number | null
  unitPrice: number | null
  region: ListingRegion
  delivery: DeliveryMode | null
  notes: string
  /** Epoch milliseconds. */
  createdAt: number
  isNew?: boolean
}

export type ContractKind = "PRODUCT_SALE" | "PATENT_LICENSE" | "B2B_LOAN"
/** COUNTERED = superseded by a counter-offer; REJECTED = declined and the thread was closed. */
export type ContractStatus = "AWAITING" | "FINALIZED" | "COUNTERED" | "REJECTED"

export interface Contract {
  id: string
  threadId: string
  listingId: string
  kind: ContractKind
  initiatorId: string
  counterpartyId: string
  /** Seller (sale), licensor (license) or lender (loan). */
  providerId: string
  product: Product
  grade: number
  quantity: number
  unitPrice: number
  totalValue: number
  delivery: DeliveryMode | null
  region: Region
  interestRate: number
  cashPct: number
  ar1Pct: number
  ar2Pct: number
  status: ContractStatus
  createdAt: number
  finalizedAt?: number | null
  /** The proposal this one counters, forming a revision chain. */
  parentId?: string | null
  revision: number
  finalizedByAdmin?: boolean | null
  adminOverridden?: boolean | null
}

export interface Thread {
  id: string
  listingId: string
  teamIds: [string, string]
  updatedAt: number
  closed?: boolean
}

/**
 * Free-text chat is intentionally not supported. Every feed entry is either a
 * structured proposal (contract / MR offer) or a hub-generated system notice.
 */
export interface ChatMessage {
  id: string
  threadId: string
  /** Team id, or "system" for hub notices. */
  from: string
  text: string
  at: number
  contractId?: string | null
  mrOfferId?: string | null
}

export type MrOfferStatus = "OFFERED" | "ACCEPTED" | "DECLINED"

export interface MrItem {
  id: number
  label: string
  description: string
}

export const MR_ITEMS: MrItem[] = [
  { id: 81, label: "MR Item #81", description: "Competitor pricing & sales volume by area" },
  { id: 82, label: "MR Item #82", description: "Industry market share by product" },
  { id: 85, label: "MR Item #85", description: "Area demand forecast for next period" },
  { id: 88, label: "MR Item #88", description: "Competitor grade & R&D positioning" },
]

export interface MrOffer {
  id: string
  threadId: string
  sellerId: string
  buyerId: string
  itemId: number
  area: Region
  /** Service-payment fee in $K. */
  priceK: number
  status: MrOfferStatus
  createdAt: number
}

export const RATING_TAGS = ["Fair Pricing", "Fast Responder", "Reliable Partner", "Clear Terms", "Flexible"] as const
export type RatingTag = (typeof RATING_TAGS)[number]

export interface Rating {
  id: string
  contractId: string
  fromId: string
  toId: string
  stars: number
  tags: RatingTag[]
  at: number
}

export interface Shipment {
  id: string
  contractId?: string | null
  sellerId: string
  buyerId: string
  product: Product
  grade: number
  quantity: number
  mode: DeliveryMode
  region: Region
}

export interface TeamStats {
  teamId: string
  reputation: number
  completed: number
  /** Sum and count of 1–5 star partner ratings. */
  ratingTotal: number
  ratingCount: number
  tagCounts: Partial<Record<RatingTag, number>>
}

export const averageRating = (s: TeamStats | undefined) => (s && s.ratingCount ? s.ratingTotal / s.ratingCount : 0)

export function topTag(s: TeamStats | undefined): RatingTag | null {
  if (!s) return null
  let best: RatingTag | null = null
  let max = 0
  for (const [tag, n] of Object.entries(s.tagCounts) as [RatingTag, number][]) {
    if (n > max) {
      best = tag
      max = n
    }
  }
  return best
}

export type ActivityKind = "listing" | "deal" | "partnership" | "license" | "contract" | "announcement" | "fine"

export const FINE_REASONS = ["Contract Breach", "Late Delivery", "Transfer Pricing Violation", "Misrepresentation", "Unsportsmanlike Conduct"] as const
export type FineReason = (typeof FINE_REASONS)[number]

export interface Fine {
  id: string
  teamId: string
  amountK: number
  reason: FineReason
  at: number
}

export interface KycRequest {
  teamId: string
  email: string
  at: number
}

export interface AiReview {
  score: number
  feeUSD: number
  warnings: string[]
  strengths: string[]
}

export interface ActivityLog {
  id: string
  kind: ActivityKind
  message: string
  /** Team the event is about, used for operator highlighting. */
  teamId?: string | null
  at: number
  isNew?: boolean
}

export type AnnouncementTag = "Official" | "Reminder" | "Community"

export interface Announcement {
  id: string
  tag: AnnouncementTag
  title: string
  body: string
  at: number
}

export interface PartnerPair {
  id: string
  teams: [string, string]
  deals: number
  volume: number
}

export interface HubSettings {
  period: string
  tradingLocked: boolean
  /** Epoch ms when the current period's contracts lock, or null when unscheduled. */
  deadlineAt: number | null
}

export const DEFAULT_SETTINGS: HubSettings = { period: "P1", tradingLocked: false, deadlineAt: null }

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  BUY: "Buying",
  SELL: "Selling",
  PARTNERSHIP: "Partnerships",
  RND: "R&D / Licensing",
}

export const TEAM_COUNT = 75
export const teamIdFor = (n: number) => `t${String(n).padStart(2, "0")}`

/** Team 25 runs the hub: it trades like any team but is visually elevated everywhere. */
export const OPERATOR_TEAM_ID = teamIdFor(25)
export const isOperator = (teamId: string | null | undefined) => teamId === OPERATOR_TEAM_ID

/**
 * Live roster registry, refreshed from Supabase on every snapshot so the many
 * components that only need a team label can stay synchronous.
 */
export const TEAM_BY_ID: Record<string, Team> = {}

/** The 75 seats always exist; live rows overlay registration status onto them. */
export function fullRoster(teams: Team[]): Team[] {
  const byId = new Map(teams.map((t) => [t.id, t]))
  return Array.from({ length: TEAM_COUNT }, (_, i) => {
    const id = teamIdFor(i + 1)
    return (
      byId.get(id) ?? {
        id,
        number: i + 1,
        name: `Team ${i + 1}`,
        company: null,
        region: null,
        whatsapp: null,
        email: null,
        equity: null,
        kyc: "unregistered",
        certified: false,
        banned: false,
        registeredAt: null,
      }
    )
  })
}

export function setTeamRegistry(teams: Team[]) {
  for (const t of teams) TEAM_BY_ID[t.id] = t
}

export function teamLabel(teamId: string) {
  return TEAM_BY_ID[teamId]?.name ?? (teamId.startsWith("t") ? `Team ${Number(teamId.slice(1))}` : teamId)
}

export const isBankrupt = (team: Team | undefined | null) => team?.equity != null && team.equity < 0

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

export const threadIdFor = (listingId: string, a: string, b: string) => `${listingId}::${[a, b].sort().join("-")}`

export function formatClock(epochMs: number) {
  return new Date(epochMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}
