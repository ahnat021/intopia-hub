"use client"

import { useState } from "react"
import { Plane, Ship, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { CURRENT_PERIOD, NEXT_PERIOD, formatUnits, productCode, type DeliveryMode } from "@/lib/intopia-rules"
import { teamLabel, type Shipment } from "@/lib/mock-data"

const MODES: { value: DeliveryMode; label: string; sub: string; icon: typeof Plane }[] = [
  { value: "AIR", label: "Airfreight", sub: `Arriving this period · ${CURRENT_PERIOD}`, icon: Plane },
  { value: "SURFACE", label: "Surface", sub: `In transit · arrives ${NEXT_PERIOD}`, icon: Ship },
]

export function FreightTracker({ shipments, viewerId }: { shipments: Shipment[]; viewerId: string }) {
  const [mode, setMode] = useState<DeliveryMode>("AIR")
  const rows = shipments.filter((s) => s.mode === mode)
  const active = MODES.find((m) => m.value === mode)!

  return (
    <section aria-labelledby="freight-title" className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="freight-title" className="flex items-center gap-2 text-sm font-semibold">
          <Truck className="size-4 text-primary" aria-hidden />
          Freight Tracker
        </h2>
        <div role="tablist" aria-label="Freight mode" className="flex rounded-lg bg-secondary p-0.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              role="tab"
              aria-selected={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", mode === m.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <m.icon className="size-3.5" aria-hidden />
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="px-4 pt-3 text-xs text-muted-foreground">{active.sub}</p>
      <ul className="flex flex-col divide-y divide-border px-1 pb-1">
        {rows.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No {active.label.toLowerCase()} shipments.</li>}
        {rows.map((s) => {
          const inbound = s.buyerId === viewerId
          const outbound = s.sellerId === viewerId
          return (
            <li key={s.id} className={cn("flex items-center gap-3 px-3 py-2.5", (inbound || outbound) && "rounded-lg bg-primary/5")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-xs font-bold">{productCode(s.product, s.grade)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {teamLabel(s.sellerId)} <span className="text-muted-foreground">→</span> {teamLabel(s.buyerId)}
                </p>
                <p className="text-xs text-muted-foreground">{s.region}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-sm tabular-nums">{formatUnits(s.quantity)}</span>
                {(inbound || outbound) && (
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider", inbound ? "text-emerald-400" : "text-sky-400")}>
                    {inbound ? "Inbound" : "Outbound"}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
