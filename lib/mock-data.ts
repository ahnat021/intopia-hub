export type ListingType = "BUY" | "SELL" | "PARTNERSHIP" | "RND"
export type ListingStatus = "OPEN" | "NEGOTIATING" | "URGENT" | "CLOSED"
export type Region = "China" | "USA" | "Europe" | "Brazil" | "Global"

export interface Team {
  id: string
  number: number
  name: string
  region: Region
  whatsapp: string
  email: string
}

export interface Listing {
  id: string
  status: ListingStatus
  type: ListingType
  teamId: string
  product: string
  quantity: string
  region: Region
  neededBy: string
  notes: string
  /** Simulation clock, in seconds since midnight. */
  createdAt: number
  isNew?: boolean
}

export type ActivityKind = "listing" | "deal" | "partnership" | "license" | "announcement"

export interface ActivityLog {
  id: string
  kind: ActivityKind
  message: string
  /** Simulation clock, in seconds since midnight. */
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

export interface LeaderboardEntry {
  teamId: string
  score: number
  delta: number
  endorsements: number
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
export const CURRENT_PERIOD = "P4"

export const REGIONS: Region[] = ["China", "USA", "Europe", "Brazil", "Global"]

/** Weighted pool used when generating listings, so China is the busiest market. */
export const REGION_WEIGHTS: Region[] = ["China", "China", "USA", "China", "Europe", "Brazil", "China", "USA", "Global"]

const DIAL_CODE: Record<Region, string> = { China: "+86", USA: "+1", Europe: "+49", Brazil: "+55", Global: "+44" }

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  BUY: "Buying",
  SELL: "Selling",
  PARTNERSHIP: "Partnership",
  RND: "R&D / Licensing",
}

const TEAM_NAMES = [
  "Nordvik Industries", "Helix Dynamics", "Aurora Holdings", "Quantum Forge", "Meridian Corp",
  "Solstice Labs", "Cobalt Ventures", "Pinnacle Systems", "Vertex Global", "Lumen Works",
  "Atlas Manufacturing", "Northstar Tech", "Sierra Components", "Orbit Electronics", "Crescent Group",
  "Ironclad Supply", "Zenith Partners", "Halcyon Trade", "Polaris Devices", "Summit Assembly",
  "Kestrel Micro", "Beacon Industries", "Tidewater Co.", "Ember Circuits", "Granite Logistics",
]

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

function mockPhone(region: Region, n: number) {
  const a = String(300 + ((n * 47) % 600))
  const b = String(1000 + ((n * 1373) % 9000))
  return `${DIAL_CODE[region]} ${a} ${b}`
}

export const TEAMS: Team[] = TEAM_NAMES.map((name, i) => {
  const region = REGIONS[i % 4]
  return {
    id: `t${String(i + 1).padStart(2, "0")}`,
    number: i + 1,
    name,
    region,
    whatsapp: mockPhone(region, i + 1),
    email: `trade@${slugify(name)}.team`,
  }
})

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

export function teamLabel(teamId: string) {
  const team = TEAM_BY_ID[teamId]
  return team ? `T${String(team.number).padStart(2, "0")}` : teamId
}

/**
 * Adds a team to the in-memory roster (or updates its contact details if the name already exists).
 * Matching is case-insensitive so existing simulation teams can sign in by name.
 */
export function registerTeam(name: string, whatsapp: string, email: string): Team {
  const existing = TEAMS.find((t) => t.name.toLowerCase() === name.trim().toLowerCase())
  if (existing) {
    existing.whatsapp = whatsapp
    existing.email = email
    return existing
  }
  const number = TEAMS.length + 1
  const team: Team = {
    id: `t${String(number).padStart(2, "0")}`,
    number,
    name: name.trim(),
    region: "Global",
    whatsapp,
    email,
  }
  TEAMS.push(team)
  TEAM_BY_ID[team.id] = team
  return team
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

interface ListingTemplate {
  product: string
  quantity: string
  notes: string
}

const TEMPLATES: Record<ListingType, ListingTemplate[]> = {
  BUY: [
    { product: "Product X Chips", quantity: "8,000 units", notes: "Premium paid for on-time P5 delivery" },
    { product: "Product Y Boards", quantity: "3,500 units", notes: "Need certified supplier, net-30 terms" },
    { product: "Product X Grade-A", quantity: "5,000 units", notes: "Shortfall after plant retooling" },
    { product: "Raw Silicon", quantity: "12 tons", notes: "Recurring order over next 3 periods" },
    { product: "Product X Chips", quantity: "3,000 units", notes: "Rush order, can collect in China" },
    { product: "Product Y Modules", quantity: "2,200 units", notes: "Open to split shipments" },
    { product: "Product X Grade-A", quantity: "9,500 units", notes: "Multi-period supply contract" },
  ],
  SELL: [
    { product: "Product X Grade-B", quantity: "6,000 units", notes: "Below market, firm price" },
    { product: "Product Y Standard", quantity: "4,800 units", notes: "Ready to ship this period" },
    { product: "Plant Capacity", quantity: "25% line time", notes: "Contract manufacturing available" },
    { product: "Product Y Surplus", quantity: "2,500 units", notes: "Volume discount over 2,000 units" },
    { product: "Warehouse Space", quantity: "18,000 sq ft", notes: "Short-term lease through P6" },
  ],
  PARTNERSHIP: [
    { product: "Joint Venture — APAC", quantity: "JV 50/50", notes: "Seeking partner with distribution reach" },
    { product: "Co-marketing Campaign", quantity: "Shared budget", notes: "Bundle Product X + Y offer" },
    { product: "Supply Alliance", quantity: "3-period term", notes: "Guaranteed volume, locked pricing" },
    { product: "Distribution Deal", quantity: "Exclusive", notes: "Americas retail channel access" },
    { product: "Shared Logistics Hub", quantity: "Cost split", notes: "Consolidate European freight" },
    { product: "Joint Bid — Gov Contract", quantity: "Consortium", notes: "Need 2 partners with capacity" },
  ],
  RND: [
    { product: "Product X v3 Patent", quantity: "License", notes: "Non-exclusive, royalty-based" },
    { product: "Yield Improvement Tech", quantity: "License", notes: "Proven +12% yield in P3" },
    { product: "Joint R&D Program", quantity: "Co-fund", notes: "Next-gen Product Y research" },
    { product: "Battery Efficiency IP", quantity: "Exclusive", notes: "Open to cross-licensing" },
  ],
}

const ACTIVE_STATUS_CYCLE: ListingStatus[] = ["OPEN", "OPEN", "NEGOTIATING", "OPEN", "URGENT", "NEGOTIATING"]
const NEEDED_BY = ["P4", "P5", "P5", "P6", "P7"]

function buildListings(type: ListingType, active: number, closed: number, offset: number): Listing[] {
  const templates = TEMPLATES[type]
  return Array.from({ length: active + closed }, (_, i) => {
    const seed = offset + i
    const template = templates[i % templates.length]
    const team = TEAMS[(seed * 7 + 3) % TEAMS.length]
    return {
      id: `L-${1000 + seed}`,
      status: i < active ? ACTIVE_STATUS_CYCLE[seed % ACTIVE_STATUS_CYCLE.length] : "CLOSED",
      type,
      teamId: team.id,
      product: template.product,
      quantity: template.quantity,
      region: REGION_WEIGHTS[(seed * 5 + 1) % REGION_WEIGHTS.length],
      neededBy: NEEDED_BY[seed % NEEDED_BY.length],
      notes: template.notes,
      createdAt: SIM_START_SECONDS - (seed * 137 + 60),
    }
  })
}

export const INITIAL_LISTINGS: Listing[] = [
  ...buildListings("BUY", 14, 2, 0),
  ...buildListings("SELL", 8, 2, 12),
  ...buildListings("PARTNERSHIP", 18, 0, 22),
  ...buildListings("RND", 6, 0, 40),
].sort((a, b) => b.createdAt - a.createdAt)

export const INITIAL_ACTIVITY: ActivityLog[] = [
  { id: "A-1", kind: "deal", message: "T07 and T12 closed a 4,000-unit Product X deal", at: SIM_START_SECONDS - 38 },
  { id: "A-2", kind: "listing", message: "T19 listed 6,000 units of Product X Grade-B", at: SIM_START_SECONDS - 142 },
  { id: "A-3", kind: "partnership", message: "T03 proposed an APAC joint venture", at: SIM_START_SECONDS - 260 },
  { id: "A-4", kind: "license", message: "T22 licensed Yield Improvement Tech to T05", at: SIM_START_SECONDS - 415 },
  { id: "A-5", kind: "announcement", message: "Market Admin opened trading for Period 4", at: SIM_START_SECONDS - 600 },
  { id: "A-6", kind: "deal", message: "T14 sold 25% line time to T09", at: SIM_START_SECONDS - 780 },
]

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "N-1",
    tag: "Official",
    title: "Period 4 trading is now open",
    body: "All contracts must be submitted to the Market Admin before 9:00 PM.",
    at: SIM_START_SECONDS - 600,
  },
  {
    id: "N-2",
    tag: "Reminder",
    title: "Offers due by 8:15 PM",
    body: "Final offers on open listings lock at 8:15 PM. Contracts lock at 8:30 PM.",
    at: SIM_START_SECONDS - 1500,
  },
  {
    id: "N-3",
    tag: "Community",
    title: "Partner mixer in Breakout Room B",
    body: "Teams exploring JV deals — meet in Room B at 7:30 PM.",
    at: SIM_START_SECONDS - 2400,
  },
  {
    id: "N-4",
    tag: "Official",
    title: "Updated tariff schedule for Europe",
    body: "Import duties on Product Y into Europe reduced to 4% this period.",
    at: SIM_START_SECONDS - 3600,
  },
]

export const LEADERBOARD: LeaderboardEntry[] = [
  { teamId: "t07", score: 98, delta: 3, endorsements: 24 },
  { teamId: "t12", score: 95, delta: 1, endorsements: 21 },
  { teamId: "t03", score: 92, delta: -1, endorsements: 19 },
  { teamId: "t22", score: 90, delta: 4, endorsements: 18 },
  { teamId: "t14", score: 87, delta: 0, endorsements: 15 },
]

export const TOP_PARTNERS: PartnerPair[] = [
  { id: "P-1", teams: ["t07", "t12"], deals: 6, volume: "$1.8M" },
  { id: "P-2", teams: ["t03", "t19"], deals: 4, volume: "$1.2M" },
  { id: "P-3", teams: ["t22", "t05"], deals: 3, volume: "$940K" },
]

export const FEATURED: FeaturedOpportunity[] = [
  {
    id: "F-1",
    type: "PARTNERSHIP",
    title: "APAC Joint Venture",
    teamId: "t03",
    value: "$2.4M est.",
    closesIn: "Closes 8:30 PM",
    description: "50/50 JV to enter Asia-Pacific retail with shared distribution and marketing.",
  },
  {
    id: "F-2",
    type: "RND",
    title: "Yield Improvement License",
    teamId: "t22",
    value: "6% royalty",
    closesIn: "Closes 8:15 PM",
    description: "Proven +12% production yield. Non-exclusive license for Product X lines.",
  },
  {
    id: "F-3",
    type: "BUY",
    title: "Bulk Product X Order",
    teamId: "t12",
    value: "8,000 units",
    closesIn: "Closes 9:00 PM",
    description: "Recurring buyer seeking reliable supply for P5 with premium on delivery.",
  },
]

export const LIVE_TEMPLATES = TEMPLATES

export function formatSimClock(secondsOfDay: number) {
  const total = ((Math.floor(secondsOfDay) % 86400) + 86400) % 86400
  const h24 = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`
}
