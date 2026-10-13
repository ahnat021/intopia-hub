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
export type SchedulePhase = "trial" | "test" | "pregame" | "real"
export interface ScheduleEvent {
  id: string
  phase: SchedulePhase
  label: string
  labelFr: string
  at: number
  note?: string
}

/** Toronto wall clock → epoch ms. Dates before Nov 1, 2026 are EDT (UTC-4); from Nov 1 they are EST (UTC-5). */
const toronto = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h + (m >= 11 ? 5 : 4), min)

export const SCHEDULE: ScheduleEvent[] = [
  { id: "T1", phase: "trial", label: "Trial #1", labelFr: "Essai #1", at: toronto(9, 21, 22) },
  { id: "T2", phase: "trial", label: "Trial #2", labelFr: "Essai #2", at: toronto(9, 23, 22) },
  { id: "T3", phase: "trial", label: "Trial #3", labelFr: "Essai #3", at: toronto(9, 25, 22) },
  { id: "T4", phase: "trial", label: "Trial #4", labelFr: "Essai #4", at: toronto(9, 28, 22) },
  { id: "T5", phase: "trial", label: "Trial #5 & Quiz #1", labelFr: "Essai #5 & Quiz #1", at: toronto(9, 30, 22) },
  { id: "P1", phase: "test", label: "Market Test — Period 1", labelFr: "Test de marché — Période 1", at: toronto(10, 5, 18, 45) },
  { id: "P2", phase: "test", label: "Market Test — Period 2", labelFr: "Test de marché — Période 2", at: toronto(10, 7, 22) },
  { id: "P3", phase: "test", label: "Market Test — Period 3", labelFr: "Test de marché — Période 3", at: toronto(10, 9, 22) },
  { id: "P4", phase: "test", label: "Market Test — Period 4", labelFr: "Test de marché — Période 4", at: toronto(10, 14, 22), note: "Results next day before 08:00" },
  { id: "P5", phase: "test", label: "Market Test — Period 5", labelFr: "Test de marché — Période 5", at: toronto(10, 16, 22) },
  { id: "P6", phase: "test", label: "Market Test — Period 6", labelFr: "Test de marché — Période 6", at: toronto(10, 19, 18, 45) },
  { id: "P7", phase: "test", label: "Market Test — Period 7 & Quiz #2 (Final)", labelFr: "Test de marché — Période 7 & Quiz #2 (final)", at: toronto(10, 21, 22), note: "INTOPIATRIAL promo expires" },
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

export const SCHEDULE_PHASES: SchedulePhase[] = ["trial", "test", "pregame", "real"]

export const PHASE_INFO: Record<SchedulePhase, { title: string; titleFr: string; note: string }> = {
  trial: { title: "Phase 1 — Structured Trials", titleFr: "Phase 1 — Essais structurés", note: "Completed" },
  test: { title: "Phase 2 — Market Test Phase", titleFr: "Phase 2 — Tests de marché", note: "INTOPIATRIAL 100% fee waiver active until Oct 21 @ 22:00 · Results next day before 08:00" },
  pregame: { title: "Pre-Game Milestones", titleFr: "Jalons pré-jeu", note: "Projections, leader briefing and networking" },
  real: { title: "Phase 3 — Official Real Game (Le Vrai Jeu)", titleFr: "Phase 3 — Le vrai jeu", note: "Standard 0.75% fee active · Results 30 mins after each decision" },
}

/**
 * Stored in hub_settings.period: "AUTO" follows the calendar; "FORCE:<id>" pins a schedule period.
 * Legacy values (e.g. "P1") are treated as AUTO.
 */
export const PERIOD_AUTO = "AUTO"
export const forcePeriod = (id: string) => `FORCE:${id}`
const forcedId = (v?: string | null) => (v?.startsWith("FORCE:") ? v.slice(6) : null)
export const isValidPeriodSetting = (v: string) => v === PERIOD_AUTO || SCHEDULE.some((e) => e.id === forcedId(v))
export const normalizePeriodSetting = (v?: string | null) => (v && isValidPeriodSetting(v) ? v : PERIOD_AUTO)

/** The first milestone whose deadline is still ahead (>= now), unless the admin forced one. */
export function activeScheduleEvent(override?: string | null, now = Date.now()): ScheduleEvent | null {
  const id = forcedId(override)
  const forced = id ? SCHEDULE.find((e) => e.id === id) : undefined
  return forced ?? SCHEDULE.find((e) => e.at >= now) ?? null
}

/** Short badge for the active period, e.g. "P4", "D1". */
export const activePeriodId = (override?: string | null, now = Date.now()) => activeScheduleEvent(override, now)?.id ?? "—"

export const nextScheduleEvent = activeScheduleEvent

export const formatToronto = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(ms)

// ── Official 35-tool Datalog Market Research catalog (5 sections) ─────────────
export type MrCategory = "B2C Marketing" | "B2B Marketing" | "Production" | "R&D" | "Financial"
export const MR_CATEGORIES: MrCategory[] = ["B2C Marketing", "B2B Marketing", "Production", "R&D", "Financial"]
export const MR_CATEGORY_LABEL: Record<MrCategory, string> = {
  "B2C Marketing": "B2C Marketing Information",
  "B2B Marketing": "B2B Marketing Information",
  Production: "Production Information",
  "R&D": "R&D Information",
  Financial: "Financial Information",
}

export interface MrCatalogItem {
  id: number
  title: string
  titleFr: string
  costUSD: number
  category: MrCategory
}

const mr = (id: number, title: string, titleFr: string, costK: number, category: MrCategory): MrCatalogItem => ({ id, title, titleFr, costUSD: costK * 1000, category })

export const MR_CATALOG: MrCatalogItem[] = [
  mr(1, "Consumer Sales and Prices", "Ventes et prix à la consommation", 50, "B2C Marketing"),
  mr(2, "Consumer Market Shares", "Parts du marché de consommation", 25, "B2C Marketing"),
  mr(3, "Advertising Expenses by Company", "Dépenses de publicité par entreprise", 10, "B2C Marketing"),
  mr(4, "Consumer Prices (live)", "Prix à la consommation (en direct)", 30, "B2C Marketing"),
  mr(5, "Estimate of Sales increment by one additional office", "Estimation de l'augmentation des ventes par un bureau supplémentaire", 10, "B2C Marketing"),
  mr(6, "Test Marketing for Battery", "Test de marketing — Batterie", 30, "B2C Marketing"),
  mr(7, "Average Consumer Prices by Grade", "Prix moyens à la consommation par qualité", 20, "B2C Marketing"),
  mr(8, "Sales Office Optimization", "Optimisation des bureaux de vente", 10, "B2C Marketing"),
  mr(9, "Test Marketing for Smartphone", "Test de marketing — Téléphone intelligent", 30, "B2C Marketing"),
  mr(10, "Sales Offices by Company", "Bureaux de vente par entreprise", 20, "B2C Marketing"),
  mr(11, "Average B2B Prices", "Prix B2B moyens", 30, "B2B Marketing"),
  mr(12, "Total Industry Sales - Consumer and B2B", "Ventes totales de l'industrie — consommateurs et B2B", 10, "B2B Marketing"),
  mr(13, "B2B Market Shares", "Parts du marché B2B", 25, "B2B Marketing"),
  mr(14, "Intercompany Sales", "Ventes intersociétés", 20, "B2B Marketing"),
  mr(15, "Intercompany Sales (live)", "Ventes intersociétés (en direct)", 30, "B2B Marketing"),
  mr(16, "List of Wholesalers", "Liste des grossistes", 20, "B2B Marketing"),
  mr(17, "Number of Plants by Company", "Nombre d'usines par entreprise", 30, "Production"),
  mr(18, "Grades and Production by Company", "Qualités et production par entreprise", 40, "Production"),
  mr(19, "Methods Improvement Expense by Company", "Dépenses d'amélioration des méthodes par entreprise", 10, "Production"),
  mr(20, "Average Variable Production Cost", "Coût variable de production moyen", 40, "Production"),
  mr(21, "Consultants' Estimate of VC for Battery", "Estimation des consultants du CV — Batterie", 30, "Production"),
  mr(22, "Consultants' Estimate of VC for Smartphone", "Estimation des consultants du CV — Téléphone intelligent", 30, "Production"),
  mr(23, "Production Grades (live)", "Qualités de production (en direct)", 20, "Production"),
  mr(24, "Optimal Plant Capacity Estimates", "Estimations de la capacité optimale des usines", 15, "Production"),
  mr(25, "Ending Inventory", "Inventaire de fin de période", 40, "Production"),
  mr(26, "R&D Expenses by Company", "Dépenses de R et D par entreprise", 20, "R&D"),
  mr(27, "Grades by Company", "Qualités par entreprise", 30, "R&D"),
  mr(28, "Licensing agreements by Company", "Accords de licence par entreprise", 30, "R&D"),
  mr(29, "Industry News and Indicators", "Nouvelles et indicateurs de l'industrie", 10, "Financial"),
  mr(30, "Financial Ratios", "Ratios financiers", 40, "Financial"),
  mr(31, "Consolidated Company Financial Statements (Excel Download)", "États financiers consolidés (téléchargement Excel)", 100, "Financial"),
  mr(32, "Lines of Credit by Company", "Lignes de crédit par entreprise", 10, "Financial"),
  mr(33, "Activity Ratios", "Ratios d'activité", 40, "Financial"),
  mr(34, "Cumulative Revenue Comparison", "Comparaison des revenus cumulés", 25, "Financial"),
  mr(35, "Cumulative Value Added Comparison", "Comparaison de la valeur ajoutée cumulée", 25, "Financial"),
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
