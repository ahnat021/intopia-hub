import {
  DEFAULT_SETTINGS,
  type ActivityLog,
  type AiReview,
  type Announcement,
  type ChatMessage,
  type Contract,
  type Fine,
  type HubSettings,
  type KycRequest,
  type Listing,
  type MrOffer,
  type PartnerPair,
  type Rating,
  type Shipment,
  type Team,
  type TeamStats,
  type Thread,
} from "@/lib/domain"

export type Viewer = { role: "team"; teamId: string } | { role: "admin" } | null

export interface HubSnapshot {
  /** False until Supabase credentials are present on the server. */
  configured: boolean
  viewer: Viewer
  teams: Team[]
  settings: HubSettings
  listings: Listing[]
  activity: ActivityLog[]
  announcements: Announcement[]
  shipments: Shipment[]
  fines: Fine[]
  stats: Record<string, TeamStats>
  topPartners: PartnerPair[]
  threads: Record<string, Thread>
  messages: ChatMessage[]
  contracts: Contract[]
  mrOffers: MrOffer[]
  ratings: Rating[]
  aiReviews: Record<string, AiReview>
  kycQueue: KycRequest[]
  adminConfigured: boolean
}

export const EMPTY_SNAPSHOT: HubSnapshot = {
  configured: false,
  viewer: null,
  teams: [],
  settings: DEFAULT_SETTINGS,
  listings: [],
  activity: [],
  announcements: [],
  shipments: [],
  fines: [],
  stats: {},
  topPartners: [],
  threads: {},
  messages: [],
  contracts: [],
  mrOffers: [],
  ratings: [],
  aiReviews: {},
  kycQueue: [],
  adminConfigured: false,
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

export type NewListingInput = Omit<Listing, "id" | "createdAt" | "status" | "isNew">
export type ContractDraft = Omit<Contract, "id" | "status" | "createdAt" | "finalizedAt" | "parentId" | "revision" | "finalizedByAdmin" | "adminOverridden">
export type MrOfferDraft = Omit<MrOffer, "id" | "status" | "createdAt">
export type RatingDraft = Omit<Rating, "id" | "at">
export type ContractOverride = Pick<Contract, "quantity" | "unitPrice" | "totalValue" | "cashPct" | "ar1Pct" | "ar2Pct">
