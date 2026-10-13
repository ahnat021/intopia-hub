"use client"

import { useMemo, useState } from "react"
import { ChevronDown, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AREA_LABEL, REGION_TO_AREA, compatibleComponentGrades, freightCost, paymentSchedule, type PaymentMode } from "@/lib/constants"
import { formatCompactUSD, formatUnits } from "@/lib/intopia-rules"
import type { Contract, Team } from "@/lib/domain"
import { VisibilityPill } from "./visibility-pill"

const PRODUCT_LABEL = { X: "X - Battery", Y: "Y - Smartphone" } as const

function modeFor(c: Contract): PaymentMode {
  if (c.cashPct === 60 && c.ar1Pct === 30 && c.ar2Pct === 10) return "STANDARD"
  if (c.cashPct === 0 && c.ar1Pct === 0 && c.ar2Pct === 100) return "LOC_RESTRICTED"
  return "CUSTOM"
}

function exportPdf(c: Contract, names: Record<string, string>) {
  const w = window.open("", "_blank", "noopener,width=800,height=900")
  if (!w) return
  const doc = w.document
  doc.title = `Contract ${c.id}`
  const rows: [string, string][] = [
    ["Contract", c.id],
    ["Initiator", names[c.initiatorId] ?? c.initiatorId],
    ["Counterparty", names[c.counterpartyId] ?? c.counterpartyId],
    ["Product", `${PRODUCT_LABEL[c.product as "X" | "Y"] ?? c.product} · Grade ${c.grade}`],
    ["Quantity", formatUnits(c.quantity)],
    ["Unit price", `$${c.unitPrice}`],
    ["Total value", formatCompactUSD(c.totalValue)],
    ["Payment split", `${c.cashPct}% t0 / ${c.ar1Pct}% t+1 / ${c.ar2Pct}% t+2`],
    ["Audit timestamp", new Date(c.finalizedAt ?? c.createdAt).toISOString()],
  ]
  const table = doc.createElement("table")
  for (const [k, v] of rows) {
    const tr = table.insertRow()
    tr.insertCell().textContent = k
    tr.insertCell().textContent = v
  }
  const h = doc.createElement("h1")
  h.textContent = "Intopia Hub — Executed Contract"
  doc.body.append(h, table)
  w.print()
}

export function ObligationsTracker({ contracts, viewerId, teamById }: { contracts: Contract[]; viewerId: string; teamById: Record<string, Team> }) {
  const mine = useMemo(
    () => contracts.filter((c) => c.status === "FINALIZED" && (c.initiatorId === viewerId || c.counterpartyId === viewerId)),
    [contracts, viewerId],
  )
  const [open, setOpen] = useState<string | null>(null)
  const names = useMemo(() => Object.fromEntries(Object.values(teamById).map((t) => [t.id, t.name])), [teamById])

  const kpis = useMemo(() => {
    const units = { X: 0, Y: 0 }
    let inflow = 0
    let outflow = 0
    for (const c of mine) {
      const seller = c.providerId === viewerId
      if (seller) {
        units[c.product as "X" | "Y"] = (units[c.product as "X" | "Y"] ?? 0) + c.quantity
        inflow += c.totalValue
      } else outflow += c.totalValue
    }
    return { units, inflow, outflow }
  }, [mine, viewerId])

  return (
    <section aria-labelledby="obl-title" className="flex flex-col gap-4">
      <h2 id="obl-title" className="font-serif text-2xl text-balance">
        My Signed Contracts & Obligations
      </h2>
      <VisibilityPill scope="private" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Delivery obligations" value={`${formatUnits(kpis.units.X)} X · ${formatUnits(kpis.units.Y)} Y`} />
        <Kpi label="Committed inflows / outflows" value={`${formatCompactUSD(kpis.inflow)} / ${formatCompactUSD(kpis.outflow)}`} />
        <Kpi label="Executed contracts" value={`${mine.length} signed`} />
      </div>

      {mine.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No signed contracts yet. Executed deals from your negotiations appear here.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {mine.map((c) => {
            const area = REGION_TO_AREA[c.region] ?? "NA"
            const product = c.product as "X" | "Y"
            const freight = freightCost(product, c.delivery === "AIR" ? "AIR" : "SURFACE", area, area === "NA" ? "EU" : "NA", c.quantity)
            const mode = modeFor(c)
            const schedule = paymentSchedule(c.totalValue, mode, c.cashPct)
            const expanded = open === c.id
            const other = c.initiatorId === viewerId ? c.counterpartyId : c.initiatorId
            return (
              <li key={c.id}>
                <Card className="glass-card">
                  <CardHeader className="p-0">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : c.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">
                          {PRODUCT_LABEL[product]} · Grade {c.grade} · {formatUnits(c.quantity)} units
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          with {names[other] ?? other} · {formatCompactUSD(c.totalValue)}
                        </p>
                      </div>
                      <ChevronDown className={`size-5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                  </CardHeader>
                  {expanded && (
                    <CardContent className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                      <Detail title="Deliverable">
                        <p>{AREA_LABEL[area]}</p>
                        {product === "Y" && <p className="text-muted-foreground">Requires component X grade {compatibleComponentGrades(c.grade).join(" or ")}</p>}
                      </Detail>
                      <Detail title="Shipping & freight">
                        <p>
                          {c.delivery ?? "SURFACE"} · est. {formatCompactUSD(freight.total)}
                        </p>
                        {freight.discount > 0 && <Badge variant="secondary">{Math.round(freight.discount * 100)}% volume discount</Badge>}
                      </Detail>
                      <Detail title={`Payment schedule (${mode === "STANDARD" ? "Standard A/P" : mode === "LOC_RESTRICTED" ? "LOC restricted" : "Custom"})`}>
                        <ul className="flex flex-col gap-1 font-mono text-xs">
                          {schedule.map((s) => (
                            <li key={s.period} className="flex justify-between">
                              <span>{s.period}</span>
                              <span>
                                {Math.round(s.pct * 100)}% · {formatCompactUSD(s.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {mode === "LOC_RESTRICTED" && <p className="mt-2 text-xs text-warning">LOC above $10M: production capped at 75% capacity.</p>}
                      </Detail>
                      <Detail title="Breach & audit">
                        <p className="font-mono text-xs">{new Date(c.finalizedAt ?? c.createdAt).toISOString()}</p>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => exportPdf(c, names)}>
                          <FileDown aria-hidden /> Export PDF
                        </Button>
                      </Detail>
                    </CardContent>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  )
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}
