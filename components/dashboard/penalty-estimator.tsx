"use client"

import { useState } from "react"
import { Calculator } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatUSD, formatUnits, productCode } from "@/lib/intopia-rules"
import { teamLabel, type Contract } from "@/lib/mock-data"

/** Team 99 (Market Admin) fills shortfalls at a premium and charges the defaulting seller. */
const EXPEDITE_PREMIUM = 0.35
const REPROCESSING_FLAT = 25_000
const REPROCESSING_PER_UNIT = 2

export function PenaltyEstimator({ contracts, viewerId }: { contracts: Contract[]; viewerId: string }) {
  const sales = contracts.filter((c) => c.kind === "PRODUCT_SALE" && c.providerId === viewerId)
  const [contracted, setContracted] = useState("7.5")
  const [delivered, setDelivered] = useState("5")
  const [price, setPrice] = useState("150")

  const c = Math.max(0, Number(contracted) || 0)
  const d = Math.min(c, Math.max(0, Number(delivered) || 0))
  const p = Math.max(0, Number(price) || 0)
  const shortfallUnits = (c - d) * 1000
  const shortfallValue = shortfallUnits * p
  const surcharge = shortfallValue * EXPEDITE_PREMIUM
  const reprocessing = shortfallUnits > 0 ? REPROCESSING_FLAT + shortfallUnits * REPROCESSING_PER_UNIT : 0
  const total = surcharge + reprocessing

  const load = (id: string) => {
    const ct = sales.find((s) => s.id === id)
    if (!ct) return
    setContracted(String(ct.quantity))
    setPrice(String(ct.unitPrice))
  }

  return (
    <section aria-labelledby="penalty-title" className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="penalty-title" className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="size-4 text-primary" aria-hidden />
          Default Penalty Estimator
        </h2>
        {sales.length > 0 && (
          <Select onValueChange={load}>
            <SelectTrigger size="sm" aria-label="Load from contract" className="h-7 w-36 text-xs">
              <SelectValue placeholder="Load contract" />
            </SelectTrigger>
            <SelectContent>
              {sales.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.id} · {productCode(s.product, s.grade)} → {teamLabel(s.counterpartyId === viewerId ? s.initiatorId : s.counterpartyId)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pt-3">
        {([["pe-c", "Contracted (K)", contracted, setContracted], ["pe-d", "Delivered (K)", delivered, setDelivered], ["pe-p", "Unit price $", price, setPrice]] as const).map(([id, label, v, set]) => (
          <div key={id} className="flex flex-col gap-1">
            <Label htmlFor={id} className="text-[11px] text-muted-foreground">{label}</Label>
            <Input id={id} type="number" inputMode="decimal" min={0} value={v} onChange={(e) => set(e.target.value)} className="h-8 font-mono text-sm" />
          </div>
        ))}
      </div>
      <dl className="flex flex-col gap-1.5 px-4 py-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Shortfall</dt><dd className="font-mono tabular-nums">{formatUnits(shortfallUnits / 1000)} units</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Team 99 expediting surcharge ({EXPEDITE_PREMIUM * 100}%)</dt><dd className="font-mono tabular-nums">{formatUSD(surcharge)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Reprocessing fee</dt><dd className="font-mono tabular-nums">{formatUSD(reprocessing)}</dd></div>
        <div className="mt-1 flex justify-between border-t border-border pt-2"><dt className="font-semibold">Estimated penalty</dt><dd className={total > 0 ? "font-mono font-bold tabular-nums text-destructive" : "font-mono font-bold tabular-nums text-success"}>{formatUSD(total)}</dd></div>
      </dl>
      <p className="px-4 pb-3 text-pretty text-[11px] leading-relaxed text-muted-foreground">
        Estimate only. Reprocessing = $25K flat + $2/unit short. Final penalties are assessed by the Market Admin.
      </p>
    </section>
  )
}
