"use client"

import { useState, type FormEvent } from "react"
import { AlertTriangle, FileSignature, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DELIVERY_INFO,
  GRADES,
  INVENTORY_SOURCES,
  OPERATING_AREAS,
  PRODUCTS,
  PRODUCT_INFO,
  averageCost,
  formatUSD,
  maxIntercompanyLoan,
  priceError,
  quantityError,
  shipmentError,
  type DeliveryMode,
  type InventorySource,
  type Product,
  type Region,
} from "@/lib/intopia-rules"
import type { ContractKind, Listing, Team } from "@/lib/mock-data"
import type { ContractDraft } from "@/lib/hub-store"

const KIND_OPTIONS: { value: ContractKind; label: string }[] = [
  { value: "PRODUCT_SALE", label: "Product Sale" },
  { value: "PATENT_LICENSE", label: "Patent Licensing" },
  { value: "B2B_LOAN", label: "B2B Loan (intercompany)" },
]

const ROLE_LABELS: Record<ContractKind, [string, string]> = {
  PRODUCT_SALE: ["Seller", "Buyer"],
  PATENT_LICENSE: ["Licensor", "Licensee"],
  B2B_LOAN: ["Lender", "Borrower"],
}

function Field({ label, htmlFor, error, children, className }: { label: string; htmlFor?: string; error?: string | null; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs">{label}</Label>
      {children}
      {error && <p role="alert" className="text-xs leading-snug text-destructive">{error}</p>}
    </div>
  )
}

function defaultProvider(listing: Listing, viewerId: string, counterpartyId: string) {
  if (listing.type === "BUY") return listing.teamId === viewerId ? counterpartyId : viewerId
  return listing.teamId
}

interface Props {
  listing: Listing
  threadId: string
  viewer: Team
  counterparty: Team
  locked: boolean
  onSubmit: (draft: ContractDraft) => void
  onCancel: () => void
}

export function ContractForm({ listing, threadId, viewer, counterparty, locked, onSubmit, onCancel }: Props) {
  const [kind, setKind] = useState<ContractKind>(listing.type === "RND" ? "PATENT_LICENSE" : "PRODUCT_SALE")
  const [providerId, setProviderId] = useState(() => defaultProvider(listing, viewer.id, counterparty.id))
  const [product, setProduct] = useState<Product>(listing.product)
  const [grade, setGrade] = useState(listing.grade)
  const [quantity, setQuantity] = useState(listing.quantity ? String(listing.quantity) : "")
  const [price, setPrice] = useState(listing.unitPrice ? String(listing.unitPrice) : "")
  const [delivery, setDelivery] = useState<DeliveryMode>(listing.delivery ?? "SURFACE")
  const [region, setRegion] = useState<Region>(listing.region === "Home Office" ? counterparty.region : listing.region)
  const [source, setSource] = useState<InventorySource>("BEGINNING")
  const [fee, setFee] = useState("")
  const [principal, setPrincipal] = useState("")
  const [rate, setRate] = useState("6")
  const [terms, setTerms] = useState({ cash: "50", ar1: "30", ar2: "20" })
  const [submitted, setSubmitted] = useState(false)

  const provider = providerId === viewer.id ? viewer : counterparty
  const qty = Number(quantity)
  const unitPrice = Number(price)
  const loanCapK = maxIntercompanyLoan(provider.equity)
  const termValues = { cash: Number(terms.cash), ar1: Number(terms.ar1), ar2: Number(terms.ar2) }
  const termSum = termValues.cash + termValues.ar1 + termValues.ar2

  const errors: Record<string, string | null> = {
    quantity: kind === "PRODUCT_SALE" ? quantityError(qty) : null,
    price: kind === "PRODUCT_SALE" ? priceError(product, grade, unitPrice) : null,
    shipment: kind === "PRODUCT_SALE" ? shipmentError(source, delivery) : null,
    fee: kind === "PATENT_LICENSE" && !(Number(fee) > 0 && Number(fee) <= 5000) ? "License fee must be between $1K and $5,000K." : null,
    principal:
      kind === "B2B_LOAN"
        ? !(Number(principal) > 0)
          ? "Enter the loan principal."
          : Number(principal) > loanCapK
            ? `Exceeds 25% of ${provider.name}'s equity — maximum ${formatUSD(loanCapK * 1000)}.`
            : null
        : null,
    rate: kind === "B2B_LOAN" && !(Number(rate) >= 0 && Number(rate) <= 25) ? "Interest rate must be 0–25%." : null,
    terms:
      Object.values(termValues).some((v) => !Number.isInteger(v) || v < 0 || v > 100)
        ? "Each payment term must be a whole percentage 0–100."
        : termSum !== 100
          ? `Payment terms must total 100% (currently ${termSum}%).`
          : null,
  }
  const show = (key: string) => (submitted ? errors[key] : null)

  const totalValue =
    kind === "PRODUCT_SALE" ? (Number.isFinite(qty * unitPrice) ? qty * 1000 * unitPrice : 0) : kind === "PATENT_LICENSE" ? Number(fee) * 1000 : Number(principal) * 1000

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (locked || Object.values(errors).some(Boolean)) return
    onSubmit({
      threadId,
      listingId: listing.id,
      kind,
      initiatorId: viewer.id,
      counterpartyId: counterparty.id,
      providerId,
      product,
      grade,
      quantity: kind === "PRODUCT_SALE" ? qty : 0,
      unitPrice: kind === "PRODUCT_SALE" ? unitPrice : 0,
      totalValue,
      delivery: kind === "PRODUCT_SALE" ? delivery : null,
      region,
      interestRate: kind === "B2B_LOAN" ? Number(rate) : 0,
      cashPct: termValues.cash,
      ar1Pct: termValues.ar1,
      ar2Pct: termValues.ar2,
    })
  }

  const [providerLabel, receiverLabel] = ROLE_LABELS[kind]

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FileSignature className="size-4 text-primary" aria-hidden />
          Draft formal trade contract
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">{viewer.name} → {counterparty.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Transaction type">
          <Select value={kind} onValueChange={(v) => setKind(v as ContractKind)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              <SelectItem value="CENTRAL_BANK" disabled>Central Bank loan / bond — disabled</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={`${providerLabel} (provides)`}>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={viewer.id}>{viewer.name} (us) · {providerLabel}</SelectItem>
              <SelectItem value={counterparty.id}>{counterparty.name} · {providerLabel}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {kind !== "B2B_LOAN" && (
          <>
            <Field label="Product">
              <Select value={product} onValueChange={(v) => setProduct(v as Product)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{PRODUCT_INFO[p].name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Grade">
              <Select value={String(grade)} onValueChange={(v) => setGrade(Number(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        {kind === "PRODUCT_SALE" && (
          <>
            <Field label="Quantity (thousand units)" htmlFor="cf-qty" error={show("quantity")}>
              <Input id="cf-qty" type="number" inputMode="decimal" step={0.5} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label={`Unit price ($) · avg cost $${averageCost(product, grade)}`} htmlFor="cf-price" error={show("price")}>
              <Input id="cf-price" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Field label="Delivery mode">
              <Select value={delivery} onValueChange={(v) => setDelivery(v as DeliveryMode)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["AIR", "SURFACE"] as const).map((d) => <SelectItem key={d} value={d}>{DELIVERY_INFO[d].label} · {DELIVERY_INFO[d].eta}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Destination area">
              <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATING_AREAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Inventory source (seller)" className="col-span-2" error={show("shipment")}>
              <Select value={source} onValueChange={(v) => setSource(v as InventorySource)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVENTORY_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        {kind === "PATENT_LICENSE" && (
          <Field label="License fee ($K)" htmlFor="cf-fee" error={show("fee")} className="col-span-2">
            <Input id="cf-fee" type="number" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="250" />
          </Field>
        )}

        {kind === "B2B_LOAN" && (
          <>
            <Field label={`Principal ($K) · max ${loanCapK.toLocaleString("en-US")}K`} htmlFor="cf-principal" error={show("principal")}>
              <Input id="cf-principal" type="number" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="400" />
            </Field>
            <Field label="Interest rate (% / period)" htmlFor="cf-rate" error={show("rate")}>
              <Input id="cf-rate" type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
            <p className="col-span-2 flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <Landmark className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden />
              Intercompany loans are capped at 25% of the lender&apos;s equity. Central Bank facilities are disabled for the practice round.
            </p>
          </>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-medium">Payment terms ({receiverLabel} pays)</legend>
        <div className="grid grid-cols-3 gap-2">
          {([["cash", "Cash now"], ["ar1", "A/R 1 period"], ["ar2", "A/R 2 periods"]] as const).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label htmlFor={`cf-${key}`} className="text-[11px] text-muted-foreground">{label}</Label>
              <div className="relative">
                <Input id={`cf-${key}`} type="number" inputMode="numeric" min={0} max={100} value={terms[key]} onChange={(e) => setTerms((t) => ({ ...t, [key]: e.target.value }))} className="pr-7 font-mono" />
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className="bg-emerald-400" style={{ width: `${Math.max(0, termValues.cash)}%` }} />
          <div className="bg-sky-400" style={{ width: `${Math.max(0, termValues.ar1)}%` }} />
          <div className="bg-violet-400" style={{ width: `${Math.max(0, termValues.ar2)}%` }} />
        </div>
        {show("terms") && <p role="alert" className="text-xs text-destructive">{errors.terms}</p>}
      </fieldset>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Contract value</p>
          <p className="font-mono text-lg font-bold tabular-nums">{formatUSD(totalValue || 0)}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={locked}>
            <FileSignature aria-hidden />
            Send for signature
          </Button>
        </div>
      </div>
      {locked && (
        <p className="flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="size-3.5" aria-hidden />
          Contracts are locked for Period 4 processing.
        </p>
      )}
    </form>
  )
}
