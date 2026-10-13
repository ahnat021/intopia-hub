/**
 * Team 25 operators shown in the hero bar. Edit names, roles, photos and
 * LinkedIn URLs here; nothing else needs to change.
 */
export const TEAM_25_OPERATORS: { name: string; role: string; imageUrl: string; linkedInUrl: string }[] = [
  { name: "Alexander Hnatovsky", role: "Co-founder · Hub Lead", imageUrl: "/images/team-25/headshot-1.png", linkedInUrl: "https://www.linkedin.com/in/alexander-hnatovsky" },
  { name: "Team 25 Operator", role: "Co-founder · Market Operations", imageUrl: "/images/team-25/headshot-2.png", linkedInUrl: "https://www.linkedin.com/" },
  { name: "Team 25 Operator", role: "Co-founder · Risk & Compliance", imageUrl: "/images/team-25/headshot-3.png", linkedInUrl: "https://www.linkedin.com/" },
  { name: "Team 25 Operator", role: "Co-founder · Data & Research", imageUrl: "/images/team-25/headshot-4.png", linkedInUrl: "https://www.linkedin.com/" },
]

export const ADMIN_LOGIN_EMAIL = "alexander.hnatovsky@gmail.com"

/** Locked INTOPIA simulation inbox for a team number. */
export const officialEmail = (teamNumber: number) => `ott${String(teamNumber).padStart(2, "0")}@intopsim.com`

export const MAX_ATTACHMENT_BYTES = 2_097_152
export const ATTACHMENT_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
}
export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png"
export const CHAT_BUCKET = "chat-attachments"

// ── Fees & promo ──────────────────────────────────────────────────────────────
export const CLEARING_FEE_RATE = 0.0075
export const CLEARING_FEE_LABEL = "Escrow Protection Fee (0.75%)"
export const PROMO_CODE = "INTOPIATRIAL"
/** End of Market Test Period 7: Oct 21, 2026 @ 22:00 EDT. */
export const PROMO_EXPIRES_AT = new Date("2026-10-21T22:00:00-04:00").getTime()
export const PROMO_RULE =
  "100% Trial Fee Waiver Active until Market Test Period 7 ends (Oct 21, 2026 @ 22:00 EDT). Standard 0.75% Escrow Protection Fee applies automatically during the Official Real Game (Nov 5–8, 2026)."
export const PROMO_ACTIVE_NOTE = "INTOPIATRIAL Market Test Waiver Active until Oct 21 @ 22:00 EDT"
export const PROMO_EXPIRED_NOTE =
  "INTOPIATRIAL Promo Expired (Market Test Ended Oct 21) — Standard 0.75% Escrow Protection Fee Active (0.375% Buyer / 0.375% Seller)"

export const promoWindowOpen = (now = Date.now()) => now <= PROMO_EXPIRES_AT

export const promoActive = (promoCodeUsed: string | null | undefined, now = Date.now()) =>
  promoCodeUsed?.toUpperCase() === PROMO_CODE && promoWindowOpen(now)

export const clearingFeeRate = (promoCodeUsed: string | null | undefined, now = Date.now()) =>
  promoActive(promoCodeUsed, now) ? 0 : CLEARING_FEE_RATE

export const clearingFee = (contractValue: number, promoCodeUsed: string | null | undefined, now = Date.now()) =>
  Math.round(clearingFeeRate(promoCodeUsed, now) * (contractValue || 0) * 100) / 100

// ── Official ADM 4711 A Fall 2026 schedule (America/Toronto) ─────────────────
export type SchedulePhase = "test" | "pregame" | "real"
export interface ScheduleEvent {
  id: string
  phase: SchedulePhase
  label: string
  labelFr: string
  at: number
  note?: string
}

/** Toronto wall clock → epoch ms. October dates are EDT (UTC-4); November dates after Nov 1 are EST (UTC-5). */
const toronto = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h + (m === 11 && d >= 1 ? 5 : 4), min)

export const SCHEDULE: ScheduleEvent[] = [
  { id: "P1", phase: "test", label: "Period 1", labelFr: "Période 1", at: toronto(10, 5, 18, 45) },
  { id: "P2", phase: "test", label: "Period 2", labelFr: "Période 2", at: toronto(10, 7, 22) },
  { id: "P3", phase: "test", label: "Period 3", labelFr: "Période 3", at: toronto(10, 9, 22) },
  { id: "P4", phase: "test", label: "Period 4", labelFr: "Période 4", at: toronto(10, 14, 22) },
  { id: "P5", phase: "test", label: "Period 5", labelFr: "Période 5", at: toronto(10, 16, 22) },
  { id: "P6", phase: "test", label: "Period 6", labelFr: "Période 6", at: toronto(10, 19, 18, 45) },
  { id: "P7", phase: "test", label: "Period 7 · Final Market Test & Individual Quiz #2", labelFr: "Période 7 · Test final & Quiz individuel #2", at: toronto(10, 21, 22), note: "INTOPIATRIAL promo expires" },
  { id: "PROJ", phase: "pregame", label: "5-Year Projections & Business Type Declaration", labelFr: "Projections sur 5 ans & déclaration du type d'entreprise", at: toronto(11, 1, 22), note: "Results: Nov 4" },
  { id: "ZOOM", phase: "pregame", label: "Team Leaders Zoom with Prof. Tim Jones", labelFr: "Zoom des chefs d'équipe avec le Prof. Tim Jones", at: toronto(11, 4, 22) },
  { id: "MIXER", phase: "pregame", label: "In-Person Networking Mixer (DMS)", labelFr: "Cocktail de réseautage en personne (DMS)", at: toronto(11, 5, 20) },
  { id: "D1", phase: "real", label: "Decision 1", labelFr: "Décision 1", at: toronto(11, 5, 23) },
  { id: "D2", phase: "real", label: "Decision 2", labelFr: "Décision 2", at: toronto(11, 6, 16) },
  { id: "D3", phase: "real", label: "Decision 3", labelFr: "Décision 3", at: toronto(11, 6, 20) },
  { id: "D4", phase: "real", label: "Decision 4", labelFr: "Décision 4", at: toronto(11, 7, 11) },
  { id: "D5", phase: "real", label: "Decision 5", labelFr: "Décision 5", at: toronto(11, 7, 15) },
  { id: "D6", phase: "real", label: "Decision 6", labelFr: "Décision 6", at: toronto(11, 7, 19) },
  { id: "D7", phase: "real", label: "Decision 7", labelFr: "Décision 7", at: toronto(11, 8, 10) },
  { id: "D8", phase: "real", label: "Decision 8", labelFr: "Décision 8", at: toronto(11, 8, 13) },
  { id: "D9", phase: "real", label: "Decision 9", labelFr: "Décision 9", at: toronto(11, 8, 16) },
]

export const PHASE_INFO: Record<SchedulePhase, { title: string; titleFr: string; note: string }> = {
  test: { title: "Market Test Phase", titleFr: "Phase des tests de marché", note: "INTOPIATRIAL 100% fee waiver active · Results next day before 08:00" },
  pregame: { title: "Pre-Game Milestones", titleFr: "Jalons pré-jeu", note: "Projections, leader briefing and networking" },
  real: { title: "Official Real Game", titleFr: "Le vrai jeu", note: "Standard 0.75% Escrow Protection Fee active · Results 30 mins after each decision" },
}

export const nextScheduleEvent = (now = Date.now()) => SCHEDULE.find((e) => e.at > now) ?? null

export const formatToronto = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(ms)

// ── Official 37-item Datalog Market Research catalog ──────────────────────────
export type MrCategory = "Marketing" | "Production" | "R&D" | "Competitive"
export const MR_CATEGORIES: MrCategory[] = ["Marketing", "Production", "R&D", "Competitive"]

export interface MrCatalogItem {
  id: number
  title: string
  titleFr: string
  costUSD: number
  category: MrCategory
}

const mr = (id: number, title: string, titleFr: string, costK: number, category: MrCategory): MrCatalogItem => ({ id, title, titleFr, costUSD: costK * 1000, category })

export const MR_CATALOG: MrCatalogItem[] = [
  mr(1, "Unit Consumer Sales and Prices by Company, Product, Market", "Ventes unitaires et prix par entreprise, produit, marché", 50, "Marketing"),
  mr(2, "Consumer Market Shares by Company, Product, Market, and Area", "Parts du marché de consommation par société, produit, marché et zone", 25, "Marketing"),
  mr(3, "Advertising Expenses by Company, Product, Market", "Dépenses de publicité par entreprise, produit, marché", 10, "Marketing"),
  mr(4, 'Consumer Prices ("live")', 'Prix à la consommation ("en direct")', 30, "Marketing"),
  mr(5, "Grades Sold to Consumers", "Grades vendus aux consommateurs", 25, "Marketing"),
  mr(6, "Ending Inventory Units by Company, Product, Market", "Terminer les unités d'inventaire par société, produit, marché", 40, "Marketing"),
  mr(7, "Estimate of sales increment by one additional sales office", "Estimation de l'augmentation des ventes par un bureau de vente supplémentaire", 10, "Marketing"),
  mr(8, "Test Marketing for Product X", "Test de marketing pour le produit X", 30, "Marketing"),
  mr(9, "Text Marketing for Product Y", "Text Marketing pour le produit Y", 30, "Marketing"),
  mr(10, "Sales Office Optimization", "Optimisation du bureau de vente", 10, "Marketing"),
  mr(11, "Industry News and Indicators", "Nouvelles et indicateurs de l'industrie", 10, "Marketing"),
  mr(12, "Total Industry Sales", "Total des ventes de l'industrie", 10, "Marketing"),
  mr(13, "Number of plants by company, product, market", "Nombre de plantes par entreprise, produit, marché", 30, "Production"),
  mr(14, "Production units and grades by company, product, market", "Unités de production et qualités par entreprise, produit, marché", 40, "Production"),
  mr(15, "Methods Improvement Expenses by Company, Product, Market", "Méthodes d'amélioration des dépenses par entreprise, produit, marché", 10, "Production"),
  mr(16, "Average production cost by company, product, market", "Coût de production moyen par entreprise, produit, marché", 40, "Production"),
  mr(17, "Estimate of Production Costs - Product X", "Estimation des coûts de production - Produit X", 30, "Production"),
  mr(18, "Estimate of Production Costs - Product Y", "Estimation des coûts de production - Produit Y", 30, "Production"),
  mr(19, 'Production Grades ("Live")', 'Niveaux de production ("Live")', 20, "Production"),
  mr(20, "Optimal Plant Capacity Estimates", "Estimations optimales de la capacité des usines", 15, "Production"),
  mr(21, "Components Available for Sale by Company, Product, Market", "Composants disponibles à la vente par entreprise, produit, marché", 20, "Production"),
  mr(22, "R&D Expenses by Company", "Dépenses de R et D par compagnie", 20, "R&D"),
  mr(23, "Patents by Company", "Brevets par compagnie", 20, "R&D"),
  mr(24, "Licensing arrangements by Company", "Dispositions d'octroi de licences par la société", 30, "R&D"),
  mr(25, "Sales Offices by Company, Market", "Bureaux de vente par entreprise, marché", 20, "Competitive"),
  mr(26, "Financial Ratios", "Ratios financiers", 40, "Competitive"),
  mr(27, "Consolidated Financial Statements (Excel)", "États financiers consolidés (Excel)", 100, "Competitive"),
  mr(28, "Lines of Credit by Company", "Lignes de crédit par compagnie", 10, "Competitive"),
  mr(29, "Activity Ratios", "Ratios d'activité", 40, "Competitive"),
  mr(30, "Intercompany Sales by Product, Market", "Ventes intersociétés par produit, marché", 20, "Competitive"),
  mr(31, "List of Wholesalers by Market", "Liste des grossistes par marché", 20, "Competitive"),
  mr(32, "List of R&D Specialists", "Liste des spécialistes de la RD", 50, "Competitive"),
  mr(33, 'Intercompany Sales ("Live")', 'Ventes intersociétés ("Live")', 30, "Competitive"),
  mr(34, "Consumer Prices by Team and Grade", "Prix à la consommation par équipe et qualité", 30, "Competitive"),
  mr(35, "Grades Manufactured by Team", "Qualités fabriquées par équipe", 30, "Competitive"),
  mr(36, "Average Consumer Prices", "Prix moyens à la consommation", 20, "Marketing"),
  mr(37, "Average B2B Prices", "Prix interentreprises (B2B) moyens", 30, "Competitive"),
]

// ── Official Datalog figures ──────────────────────────────────────────────────
export type AreaCode = "NA" | "EU" | "CH"
export const AREA_CODES: AreaCode[] = ["NA", "EU", "CH"]
export const AREA_LABEL: Record<AreaCode, string> = { NA: "Area 1: North America", EU: "Area 2: European Union", CH: "Area 3: China" }
export const REGION_TO_AREA: Record<string, AreaCode> = { "North America": "NA", Europe: "EU", China: "CH" }

export const DATALOG = {
  X: { name: "Battery", basePrice: { NA: 80, EU: 82, CH: 75 }, variableCost: { NA: 30, EU: 31, CH: 28 }, capacity: { NA: 100_000, EU: 135_000, CH: 110_000 } },
  Y: { name: "Smartphone", basePrice: { NA: 240, EU: 235, CH: 200 }, variableCost: { NA: 90, EU: 100, CH: 85 }, capacity: { NA: 50_000, EU: 85_000, CH: 62_000 } },
} as const

/** Per-unit freight (USD) between areas. Same-area moves are free. */
export const FREIGHT_MATRIX: Record<"SURFACE" | "AIR", Record<"X" | "Y", Record<AreaCode, Record<AreaCode, number>>>> = {
  SURFACE: {
    X: { NA: { NA: 0, EU: 4, CH: 5 }, EU: { NA: 4, EU: 0, CH: 4 }, CH: { NA: 5, EU: 4, CH: 0 } },
    Y: { NA: { NA: 0, EU: 8, CH: 10 }, EU: { NA: 8, EU: 0, CH: 8 }, CH: { NA: 10, EU: 8, CH: 0 } },
  },
  AIR: {
    X: { NA: { NA: 0, EU: 10, CH: 12 }, EU: { NA: 10, EU: 0, CH: 10 }, CH: { NA: 12, EU: 10, CH: 0 } },
    Y: { NA: { NA: 0, EU: 20, CH: 24 }, EU: { NA: 20, EU: 0, CH: 20 }, CH: { NA: 24, EU: 20, CH: 0 } },
  },
}

/** Volume discount: 50% surface / 33% air when a single shipment exceeds 600k X or 200k Y units. */
export function freightCost(product: "X" | "Y", mode: "SURFACE" | "AIR", from: AreaCode, to: AreaCode, units: number) {
  const perUnit = FREIGHT_MATRIX[mode][product][from][to]
  const threshold = product === "X" ? 600_000 : 200_000
  const discount = units > threshold ? (mode === "SURFACE" ? 0.5 : 0.33) : 0
  return { perUnit, discount, total: Math.round(perUnit * units * (1 - discount)) }
}

/** Datalog conversion chart: assembling Y grade n needs component X grade n-1 or n. */
export const compatibleComponentGrades = (yGrade: number) => [yGrade - 1, yGrade].filter((g) => g >= 0 && g <= 9)

export type PaymentMode = "STANDARD" | "LOC_RESTRICTED" | "CUSTOM"
export const LOC_RESTRICTION_THRESHOLD = 10_000_000

export function paymentSchedule(total: number, mode: PaymentMode, customCashPct = 100) {
  const split =
    mode === "STANDARD" ? [0.6, 0.3, 0.1] : mode === "LOC_RESTRICTED" ? [0, 0, 1] : [customCashPct / 100, 1 - customCashPct / 100, 0]
  return split.map((pct, i) => ({ period: i === 0 ? "t0" : `t+${i}`, pct, amount: Math.round(total * pct) }))
}
