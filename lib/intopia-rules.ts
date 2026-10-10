/**
 * Official INTOPIA simulation rules (practice round). Every form and action in the hub
 * validates against these helpers so the UI can never produce an illegal trade.
 */

export type Product = "X" | "Y"
export type Region = "North America" | "Europe" | "China"
/** Listings may also originate from the Home Office, but only for R&D / licensing. */
export type ListingRegion = Region | "Home Office"
export type DeliveryMode = "AIR" | "SURFACE"

export const PRODUCTS: Product[] = ["X", "Y"]
export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export const OPERATING_AREAS: Region[] = ["North America", "Europe", "China"]

export const PRODUCT_INFO: Record<Product, { name: string; kind: string }> = {
  X: { name: "Product X", kind: "Batteries / Components" },
  Y: { name: "Product Y", kind: "Smartphones / Finished Goods" },
}

export const HOME_OFFICE = {
  country: "Canada",
  allowed: "Capital, R&D and Information only",
  forbidden: "No manufacturing or consumer sales",
}

export const CURRENT_PERIOD = "P4"
export const NEXT_PERIOD = "P5"

/** Unit price bounds in $US per unit. */
export const PRICE_BOUNDS: Record<Product, { min: number; max: number }> = {
  X: { min: 5, max: 80 },
  Y: { min: 40, max: 400 },
}

/** Quantities are entered in thousands of units. */
export const QTY_BOUNDS = { min: 0.5, max: 2000 }

export const MAX_FACTORIES_PER_AREA = 3
export const INTERCOMPANY_LENDING_CAP = 0.25

export const FACTORY_RULES: Record<Product, { build: string; firstPeriod: number; note: string }> = {
  X: { build: "0.5 periods", firstPeriod: 0.5, note: "Produces at 50% capacity during the construction period" },
  Y: { build: "1 full period", firstPeriod: 0, note: "0% production while building; on-stream next period" },
}

export const DELIVERY_INFO: Record<DeliveryMode, { label: string; short: string; eta: string; arrives: string }> = {
  AIR: { label: "Airfreight", short: "Air", eta: "Immediate · arrives P4", arrives: CURRENT_PERIOD },
  SURFACE: { label: "Surface Freight", short: "Surface", eta: "1 period · arrives P5", arrives: NEXT_PERIOD },
}

/** Simulated average cost of goods per unit; transfer prices must clear this to avoid tax penalties. */
export function averageCost(product: Product, grade: number) {
  return product === "X" ? 12 + grade * 3 : 70 + grade * 14
}

export type InventorySource = "BEGINNING" | "PRODUCED_THIS_PERIOD" | "RECEIVED_BY_AIR"

export const INVENTORY_SOURCES: { value: InventorySource; label: string }[] = [
  { value: "BEGINNING", label: "Beginning inventory (on hand)" },
  { value: "RECEIVED_BY_AIR", label: "Lot received by airfreight this period" },
  { value: "PRODUCED_THIS_PERIOD", label: "Produced this period" },
]

export function shipmentError(source: InventorySource, mode: DeliveryMode): string | null {
  if (source === "PRODUCED_THIS_PERIOD")
    return "Inventory cannot be produced and shipped in the same period. Ship it next period."
  if (source === "RECEIVED_BY_AIR" && mode === "AIR")
    return "No back-to-back airfreight: lots received by air must be re-shipped by surface."
  return null
}

export function priceError(product: Product, grade: number, price: number, enforceCost = true): string | null {
  const { min, max } = PRICE_BOUNDS[product]
  if (!Number.isFinite(price) || price <= 0) return "Enter a unit price."
  if (price < min || price > max) return `Product ${product} must be priced between $${min} and $${max} per unit.`
  const cost = averageCost(product, grade)
  if (enforceCost && price <= cost)
    return `Transfer price must exceed the average cost of goods ($${cost}/unit for ${product}${grade}) to avoid tax evasion penalties.`
  return null
}

export function quantityError(qty: number): string | null {
  if (!Number.isFinite(qty) || qty < QTY_BOUNDS.min) return `Minimum quantity is ${QTY_BOUNDS.min}K units.`
  if (qty > QTY_BOUNDS.max) return `Maximum quantity is ${QTY_BOUNDS.max.toLocaleString("en-US")}K units.`
  return null
}

/** Equity is held in $K. */
export function maxIntercompanyLoan(equityK: number) {
  return Math.max(0, Math.floor(equityK * INTERCOMPANY_LENDING_CAP))
}

export const productCode = (product: Product, grade: number) => `${product}${grade}`

export function formatUnits(thousands: number) {
  return Math.round(thousands * 1000).toLocaleString("en-US")
}

export function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}

export function formatCompactUSD(value: number) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000).toLocaleString("en-US")}K`
  return `$${Math.round(value)}`
}

export const RULE_SECTIONS: { title: string; rules: string[] }[] = [
  {
    title: "Products",
    rules: [
      "Only Product X (Batteries / Components) and Product Y (Smartphones / Finished Goods) exist.",
      "Both products are traded strictly in Grades 0 through 9.",
    ],
  },
  {
    title: "Home Office & Operating Areas",
    rules: [
      "The Home Office is in Canada and handles only Capital, R&D and Information.",
      "No manufacturing or consumer sales can occur in the Home Office.",
      "There are exactly 3 operating areas: North America, Europe and China.",
    ],
  },
  {
    title: "Production & Shipping",
    rules: [
      "A team can never produce and ship the same inventory in the same period.",
      "Surface freight takes 1 full period and arrives as ending inventory next period.",
      "Airfreight arrives at the beginning of the current period and is available immediately.",
      "Lots received by air cannot be re-shipped by air in the same period.",
    ],
  },
  {
    title: "Financial Constraints",
    rules: [
      "Consolidated equity below 0 locks a team out of the hub (bankruptcy).",
      "Intercompany lending cannot exceed 25% of the lending team's total equity.",
      "Central Bank loans and bonds are disabled for the practice round.",
      "Transfer prices between areas must exceed average cost of goods.",
    ],
  },
]
