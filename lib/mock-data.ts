import {
  OPERATING_AREAS,
  averageCost,
  type DeliveryMode,
  type ListingRegion,
  type Product,
  type Region,
} from "./intopia-rules"

export type { DeliveryMode, ListingRegion, Product, Region } from "./intopia-rules"

export type ListingType = "BUY" | "SELL" | "PARTNERSHIP" | "RND"
export type ListingStatus = "OPEN" | "NEGOTIATING" | "PENDING_SIGNATURE" | "CLOSED"

export interface Team {
  id: string
  number: number
  name: string
  company: string
  region: Region
  whatsapp: string
  email: string
  /** Consolidated equity in $K. Below zero means bankruptcy. */
  equity: number
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
  /** Simulation clock, in seconds since midnight. */
  createdAt: number
  isNew?: boolean
}

export type ContractKind = "PRODUCT_SALE" | "PATENT_LICENSE" | "B2B_LOAN"
export type ContractStatus = "AWAITING" | "FINALIZED"

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
  finalizedAt?: number
}

export interface Thread {
  id: string
  listingId: string
  teamIds: [string, string]
  updatedAt: number
}

export interface ChatMessage {
  id: string
  threadId: string
  /** Team id, or "system" for hub notices. */
  from: string
  text: string
  at: number
  contractId?: string
}

export interface Shipment {
  id: string
  contractId?: string
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
  /** 0–5 rating for meeting delivery and payment deadlines. */
  promptness: number
}

export type ActivityKind = "listing" | "deal" | "partnership" | "license" | "contract" | "announcement"

export interface ActivityLog {
  id: string
  kind: ActivityKind
  message: string
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
  volume: string
}

export interface FeaturedOpportunity {
  id: string
  type: ListingType
  title: string
  teamId: string
  value: string
  closesIn: string
  description: string
}

/** Simulation clock: trading opened at 6:45:23 PM, period closes at 9:00 PM. */
export const SIM_START_SECONDS = 18 * 3600 + 45 * 60 + 23
export const SIM_DEADLINE_SECONDS = 21 * 3600
export const LOCKOUT_SECONDS = 20 * 3600 + 30 * 60
export { CURRENT_PERIOD } from "./intopia-rules"

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  BUY: "Buying",
  SELL: "Selling",
  PARTNERSHIP: "Partnerships",
  RND: "R&D / Licensing",
}

const COMPANIES = [
  "Nordvik Industries", "Helix Dynamics", "Aurora Holdings", "Quantum Forge", "Meridian Corp",
  "Solstice Labs", "Cobalt Ventures", "Pinnacle Systems", "Vertex Global", "Lumen Works",
  "Atlas Manufacturing", "Northstar Tech", "Sierra Components", "Orbit Electronics", "Crescent Group",
  "Ironclad Supply", "Zenith Partners", "Halcyon Trade", "Polaris Devices", "Summit Assembly",
  "Kestrel Micro", "Beacon Industries", "Tidewater Co.", "Ember Circuits", "Granite Logistics",
]

const DIAL_CODE: Record<Region, string> = { "North America": "+1", Europe: "+49", China: "+86" }

export const teamIdFor = (n: number) => `t${String(n).padStart(2, "0")}`

export const BANKRUPT_TEAM_ID = teamIdFor(25)

export const TEAMS: Team[] = COMPANIES.map((company, i) => {
  const n = i + 1
  const region = OPERATING_AREAS[i % 3]
  return {
    id: teamIdFor(n),
    number: n,
    name: `Team ${n}`,
    company,
    region,
    whatsapp: `${DIAL_CODE[region]} ${300 + ((n * 47) % 600)} ${1000 + ((n * 1373) % 9000)}`,
    email: `team${n}@intopia.trade`,
    equity: n === 25 ? -184 : 1400 + ((n * 613) % 2600),
  }
})

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

/** Teams able to trade (bankrupt teams are excluded from generated market data). */
export const ACTIVE_TEAMS = TEAMS.filter((t) => t.equity >= 0)

export function teamLabel(teamId: string) {
  return TEAM_BY_ID[teamId]?.name ?? teamId
}

export function updateTeamContact(teamId: string, whatsapp: string, email: string) {
  const team = TEAM_BY_ID[teamId]
  if (!team) return
  team.whatsapp = whatsapp
  team.email = email
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

export const threadIdFor = (listingId: string, a: string, b: string) => `${listingId}::${[a, b].sort().join("-")}`

const QTY_POOL = [2, 3.5, 5, 7.5, 8, 12, 4.5, 6]
const TRADE_NOTES: Record<"BUY" | "SELL", string[]> = {
  BUY: [
    "Premium paid for on-time delivery",
    "Need certified supplier, flexible payment terms",
    "Shortfall after plant construction delay",
    "Recurring order over the next 3 periods",
    "Rush order — airfreight preferred",
    "Open to split shipments",
  ],
  SELL: [
    "Below market, firm price",
    "Beginning inventory, ready to ship",
    "Volume discount over 5K units",
    "Surplus after demand forecast revision",
    "Surface freight only, arrives P5",
  ],
}

const PARTNERSHIPS = [
  { title: "Joint Venture", notes: "Seeking partner with distribution reach in the area" },
  { title: "Supply Alliance", notes: "Guaranteed volume, locked pricing for 3 periods" },
  { title: "Distribution Deal", notes: "Exclusive retail channel access" },
  { title: "Shared Logistics Hub", notes: "Consolidate surface freight to cut transit cost" },
  { title: "Co-marketing Campaign", notes: "Bundle Product X + Y offer" },
  { title: "Joint Plant Build", notes: "Co-fund a new factory (max 3 X / 3 Y per area)" },
]

const LICENSES = [
  { title: "Patent License", notes: "Non-exclusive, royalty-based license" },
  { title: "Grade Upgrade R&D", notes: "Proven path to the next grade in one period" },
  { title: "Joint R&D Program", notes: "Co-fund Home Office research" },
  { title: "Cross-License", notes: "Swap grade technology between teams" },
]

const ACTIVE_STATUS_CYCLE: ListingStatus[] = ["OPEN", "OPEN", "NEGOTIATING", "OPEN", "NEGOTIATING", "OPEN"]

function buildListing(type: ListingType, index: number, seed: number, closed: boolean): Listing {
  const team = ACTIVE_TEAMS[(seed * 7 + 3) % ACTIVE_TEAMS.length]
  const product: Product = seed % 3 === 0 ? "Y" : "X"
  const grade = (seed * 3 + 1) % 10
  const status = closed ? "CLOSED" : ACTIVE_STATUS_CYCLE[seed % ACTIVE_STATUS_CYCLE.length]
  const region = OPERATING_AREAS[(seed * 5 + 1) % 3]
  const base = { id: `L-${1000 + seed}`, status, type, teamId: team.id, product, grade, createdAt: SIM_START_SECONDS - (seed * 137 + 60) }

  if (type === "BUY" || type === "SELL") {
    const notes = TRADE_NOTES[type]
    return {
      ...base,
      title: `Product ${product} · Grade ${grade}`,
      quantity: QTY_POOL[seed % QTY_POOL.length],
      unitPrice: Math.round(averageCost(product, grade) * (1.15 + (seed % 5) * 0.07)),
      region,
      delivery: seed % 2 === 0 ? "SURFACE" : "AIR",
      notes: notes[index % notes.length],
    }
  }
  const tpl = type === "PARTNERSHIP" ? PARTNERSHIPS[index % PARTNERSHIPS.length] : LICENSES[index % LICENSES.length]
  return {
    ...base,
    title: `${tpl.title} — ${type === "RND" ? `${product}${grade}` : region}`,
    quantity: null,
    unitPrice: null,
    region: type === "RND" && seed % 2 === 0 ? "Home Office" : region,
    delivery: null,
    notes: tpl.notes,
  }
}

function buildListings(type: ListingType, active: number, closed: number, offset: number) {
  return Array.from({ length: active + closed }, (_, i) => buildListing(type, i, offset + i, i >= active))
}

/** The seeded deal lets the demo start with a contract already waiting for Team 7's signature. */
export const SEED_LISTING_ID = "L-0900"
const SEED_THREAD_ID = threadIdFor(SEED_LISTING_ID, "t07", "t18")

const SEED_LISTING: Listing = {
  id: SEED_LISTING_ID,
  status: "PENDING_SIGNATURE",
  type: "SELL",
  teamId: "t07",
  title: "Product Y · Grade 4",
  product: "Y",
  grade: 4,
  quantity: 7.5,
  unitPrice: 152,
  region: "Europe",
  delivery: "SURFACE",
  notes: "Beginning inventory in the Europe warehouse",
  createdAt: SIM_START_SECONDS - 40,
}

export const INITIAL_LISTINGS: Listing[] = [
  SEED_LISTING,
  ...buildListings("BUY", 14, 2, 0),
  ...buildListings("SELL", 9, 2, 16),
  ...buildListings("PARTNERSHIP", 10, 1, 29),
  ...buildListings("RND", 6, 0, 41),
].sort((a, b) => b.createdAt - a.createdAt)

export const INITIAL_THREADS: Record<string, Thread> = {
  [SEED_THREAD_ID]: { id: SEED_THREAD_ID, listingId: SEED_LISTING_ID, teamIds: ["t18", "t07"], updatedAt: SIM_START_SECONDS - 5 },
}

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "C-0001",
    threadId: SEED_THREAD_ID,
    listingId: SEED_LISTING_ID,
    kind: "PRODUCT_SALE",
    initiatorId: "t18",
    counterpartyId: "t07",
    providerId: "t07",
    product: "Y",
    grade: 4,
    quantity: 7.5,
    unitPrice: 150,
    totalValue: 7500 * 150,
    delivery: "SURFACE",
    region: "Europe",
    interestRate: 0,
    cashPct: 50,
    ar1Pct: 30,
    ar2Pct: 20,
    status: "AWAITING",
    createdAt: SIM_START_SECONDS - 5,
  },
]

export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "M-s1", threadId: SEED_THREAD_ID, from: "t18", text: "Hi Team 7 — we need Y4 for our Europe launch. Can you do 7,500 units?", at: SIM_START_SECONDS - 300 },
  { id: "M-s2", threadId: SEED_THREAD_ID, from: "t07", text: "Yes, from beginning inventory. $152/unit, surface freight so it lands in P5.", at: SIM_START_SECONDS - 210 },
  { id: "M-s3", threadId: SEED_THREAD_ID, from: "t18", text: "Meet at $150 with 50% cash now, the rest on A/R? Sending the formal contract.", at: SIM_START_SECONDS - 90 },
  { id: "M-s4", threadId: SEED_THREAD_ID, from: "t18", text: "Formal trade contract submitted for signature.", at: SIM_START_SECONDS - 5, contractId: "C-0001" },
]

export const INITIAL_SHIPMENTS: Shipment[] = [
  { id: "S-1", sellerId: "t12", buyerId: "t03", product: "X", grade: 2, quantity: 6, mode: "AIR", region: "China" },
  { id: "S-2", sellerId: "t22", buyerId: "t05", product: "Y", grade: 5, quantity: 2.5, mode: "AIR", region: "North America" },
  { id: "S-3", sellerId: "t14", buyerId: "t09", product: "X", grade: 6, quantity: 12, mode: "SURFACE", region: "Europe" },
  { id: "S-4", sellerId: "t07", buyerId: "t11", product: "Y", grade: 3, quantity: 4, mode: "SURFACE", region: "China" },
  { id: "S-5", sellerId: "t19", buyerId: "t02", product: "X", grade: 1, quantity: 8, mode: "SURFACE", region: "North America" },
]

export const INITIAL_STATS: Record<string, TeamStats> = Object.fromEntries(
  ACTIVE_TEAMS.map((t) => [
    t.id,
    {
      teamId: t.id,
      reputation: 72 + ((t.number * 37) % 27),
      completed: 1 + ((t.number * 5) % 11),
      promptness: Math.round((3.2 + ((t.number * 13) % 19) / 10) * 10) / 10,
    },
  ]),
)

export const INITIAL_ACTIVITY: ActivityLog[] = [
  { id: "A-0", kind: "contract", message: "Team 18 sent Team 7 a Product Y contract for signature", at: SIM_START_SECONDS - 5 },
  { id: "A-1", kind: "deal", message: "Team 12 & Team 3 closed a 6,000-unit Product X deal", at: SIM_START_SECONDS - 38 },
  { id: "A-2", kind: "listing", message: "Team 19 listed 8,000 units of Product X Grade 1", at: SIM_START_SECONDS - 142 },
  { id: "A-3", kind: "partnership", message: "Team 3 proposed a China joint venture", at: SIM_START_SECONDS - 260 },
  { id: "A-4", kind: "license", message: "Team 22 licensed X5 grade technology to Team 5", at: SIM_START_SECONDS - 415 },
  { id: "A-5", kind: "announcement", message: "Market Admin opened trading for Period 4", at: SIM_START_SECONDS - 600 },
]

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "N-1", tag: "Official", title: "Period 4 trading is now open", body: "All contracts must be signed by both teams before 8:30 PM.", at: SIM_START_SECONDS - 600 },
  { id: "N-2", tag: "Reminder", title: "Offers due by 8:15 PM", body: "Final offers lock at 8:15 PM. Contracts lock at 8:30 PM for P4 processing.", at: SIM_START_SECONDS - 1500 },
  { id: "N-3", tag: "Official", title: "Central Bank facilities disabled", body: "Central Bank loans and bonds are unavailable in the practice round. Use B2B loans (max 25% of lender equity).", at: SIM_START_SECONDS - 2400 },
  { id: "N-4", tag: "Community", title: "Partner mixer in Breakout Room B", body: "Teams exploring JVs — meet in Room B at 7:30 PM.", at: SIM_START_SECONDS - 3600 },
]

export const TOP_PARTNERS: PartnerPair[] = [
  { id: "P-1", teams: ["t07", "t12"], deals: 6, volume: "$1.8M" },
  { id: "P-2", teams: ["t03", "t19"], deals: 4, volume: "$1.2M" },
  { id: "P-3", teams: ["t22", "t05"], deals: 3, volume: "$940K" },
]

export const FEATURED: FeaturedOpportunity[] = [
  { id: "F-1", type: "PARTNERSHIP", title: "China Joint Venture", teamId: "t03", value: "$2.4M est.", closesIn: "Closes 8:30 PM", description: "50/50 JV to enter China retail with shared distribution and a joint Y plant." },
  { id: "F-2", type: "RND", title: "X5 Grade License", teamId: "t22", value: "6% royalty", closesIn: "Closes 8:15 PM", description: "Home Office R&D: license Grade 5 technology for Product X lines." },
  { id: "F-3", type: "BUY", title: "Bulk Product X Order", teamId: "t12", value: "8,000 units", closesIn: "Closes 8:30 PM", description: "Recurring buyer seeking reliable X2 supply for P5 with a delivery premium." },
]

export function formatSimClock(secondsOfDay: number) {
  const total = ((Math.floor(secondsOfDay) % 86400) + 86400) % 86400
  const h24 = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`
}

export const LIVE_SEED = { buildListing }
