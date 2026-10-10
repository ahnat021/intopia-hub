"use client"

import { useMemo, useState } from "react"
import { Clock, ShieldAlert, ShieldCheck, Scale, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TEAM_BY_ID, teamLabel, type Listing } from "@/lib/mock-data"
import { TypeLabel } from "./listing-badges"

export type ComplianceStatus = "Cleared" | "Pending Review" | "Flagged"

interface ComplianceCheck {
  listing: Listing
  status: ComplianceStatus
  rule: string
}

const STATUS_META: Record<ComplianceStatus, { icon: LucideIcon; className: string }> = {
  Cleared: { icon: ShieldCheck, className: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
  "Pending Review": { icon: Clock, className: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  Flagged: { icon: ShieldAlert, className: "bg-rose-500/15 text-rose-400 ring-rose-500/30" },
}

const FILTERS = ["All", "Flagged", "Pending Review", "Cleared"] as const
type Filter = (typeof FILTERS)[number]

function parseUnits(quantity: string) {
  const match = quantity.replace(/,/g, "").match(/^(\d+)\s*units?/i)
  return match ? Number(match[1]) : null
}

/** Automated supervision rules applied to every active large transaction. */
function assess(listing: Listing): ComplianceCheck | null {
  if (listing.status === "CLOSED") return null
  const units = parseUnits(listing.quantity)
  const text = `${listing.product} ${listing.quantity}`.toLowerCase()

  if (units !== null && units >= 8000)
    return { listing, status: "Flagged", rule: "Exceeds 8,000-unit single-trade concentration limit" }
  if (listing.type === "RND" && (text.includes("exclusive") || listing.region === "China"))
    return { listing, status: "Flagged", rule: "Cross-border IP transfer — export control review" }
  if (listing.type === "PARTNERSHIP" && /joint venture|exclusive|consortium|jv/.test(text))
    return { listing, status: "Pending Review", rule: "Market concentration / antitrust screening" }
  if (units !== null && units >= 5000)
    return { listing, status: "Pending Review", rule: "Large transaction — supervisor sign-off required" }
  if ((units !== null && units >= 3000) || listing.type === "RND")
    return { listing, status: "Cleared", rule: "Within automated trading limits" }
  return null
}

export function CompliancePanel({ listings }: { listings: Listing[] }) {
  const [overrides, setOverrides] = useState<Record<string, ComplianceStatus>>({})
  const [filter, setFilter] = useState<Filter>("All")

  const checks = useMemo(() => {
    const result: ComplianceCheck[] = []
    for (const l of listings) {
      const check = assess(l)
      if (check) result.push(overrides[l.id] ? { ...check, status: overrides[l.id] } : check)
    }
    const order: Record<ComplianceStatus, number> = { Flagged: 0, "Pending Review": 1, Cleared: 2 }
    return result.sort((a, b) => order[a.status] - order[b.status] || b.listing.createdAt - a.listing.createdAt)
  }, [listings, overrides])

  const counts = useMemo(() => {
    const c: Record<ComplianceStatus, number> = { Cleared: 0, "Pending Review": 0, Flagged: 0 }
    for (const check of checks) c[check.status]++
    return c
  }, [checks])

  const visible = filter === "All" ? checks : checks.filter((c) => c.status === filter)

  function decide(listing: Listing, status: ComplianceStatus) {
    setOverrides((prev) => ({ ...prev, [listing.id]: status }))
    toast(status === "Cleared" ? "Trade cleared" : "Trade flagged for regulator", {
      description: `${teamLabel(listing.teamId)} · ${listing.product}`,
    })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/15 bg-white/5 hover:bg-white/10">
          <Scale className="size-4" aria-hidden />
          Compliance
          {counts.Flagged > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 font-mono text-[10px] font-bold tabular-nums text-white">
              {counts.Flagged}
            </span>
          )}
          <span className="sr-only">, {counts.Flagged} flagged trades</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="gap-4 border-b border-border p-5">
          <div>
            <SheetTitle className="flex items-center gap-2">
              <Scale className="size-5 text-primary" aria-hidden />
              Compliance & Supervision
            </SheetTitle>
            <SheetDescription>Automated checks on large transactions. Flagged trades need regulatory review.</SheetDescription>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {(["Flagged", "Pending Review", "Cleared"] as const).map((s) => {
              const { icon: Icon, className } = STATUS_META[s]
              return (
                <div key={s} className={cn("flex flex-col gap-1 rounded-lg p-3 ring-1 ring-inset", className)}>
                  <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                    <Icon className="size-3.5" aria-hidden />
                    {s === "Pending Review" ? "Pending" : s}
                  </dt>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground">{counts[s]}</dd>
                </div>
              )
            })}
          </dl>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="w-full bg-secondary/60">
              {FILTERS.map((f) => (
                <TabsTrigger key={f} value={f} className="flex-1 text-xs">
                  {f === "Pending Review" ? "Pending" : f}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </SheetHeader>

        <ul className="flex-1 divide-y divide-border overflow-y-auto" aria-label="Compliance checks">
          {visible.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No trades in this queue.</li>}
          {visible.map(({ listing, status, rule }) => {
            const { icon: Icon, className } = STATUS_META[status]
            const team = TEAM_BY_ID[listing.teamId]
            return (
              <li key={listing.id} className="flex flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listing.product}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{teamLabel(listing.teamId)}</span> · {team?.name} · {listing.region}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                      className,
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                    {status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <TypeLabel type={listing.type} />
                  <span className="font-mono text-muted-foreground">{listing.quantity}</span>
                </div>
                <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Rule:</span> {rule}
                </p>
                {status !== "Cleared" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => decide(listing, "Cleared")}>
                      <ShieldCheck className="size-3.5" aria-hidden />
                      Clear trade
                    </Button>
                    {status === "Pending Review" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => decide(listing, "Flagged")}
                      >
                        <ShieldAlert className="size-3.5" aria-hidden />
                        Escalate
                      </Button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
