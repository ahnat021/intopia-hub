"use client"

import { memo, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, FileSignature, MessagesSquare, Pause, Play, Search, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { GRADES, OPERATING_AREAS, PRODUCT_INFO, formatUnits } from "@/lib/intopia-rules"
import { teamLabel, type Listing, type ListingType } from "@/lib/mock-data"
import { DeliveryLabel, StatusBadge, TypeLabel } from "./listing-badges"

const PAGE_SIZE = 8

type Tab = "ALL" | ListingType
const TABS: { value: Tab; label: string }[] = [
  { value: "ALL", label: "All Listings" },
  { value: "BUY", label: "Buying" },
  { value: "SELL", label: "Selling" },
  { value: "PARTNERSHIP", label: "Partnerships" },
  { value: "RND", label: "R&D / Licensing" },
]

interface Props {
  listings: Listing[]
  viewerId: string
  /** Listing ids that have a contract involving the viewer. */
  contractListingIds: Set<string>
  isLive: boolean
  onToggleLive: () => void
  onOpen: (listing: Listing) => void
}

export const LiveMarketplace = memo(function LiveMarketplace({ listings, viewerId, contractListingIds, isLive, onToggleLive, onOpen }: Props) {
  const [tab, setTab] = useState<Tab>("ALL")
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("ALL")
  const [grade, setGrade] = useState("ALL")
  const [page, setPage] = useState(1)
  const debounced = useDebouncedValue(query, 250)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return listings.filter((l) => {
      if (tab !== "ALL" && l.type !== tab) return false
      if (region !== "ALL" && l.region !== region) return false
      if (grade !== "ALL" && String(l.grade) !== grade) return false
      if (!q) return true
      return [l.title, l.notes, teamLabel(l.teamId), l.region, `${l.product}${l.grade}`, PRODUCT_INFO[l.product].kind]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [listings, tab, region, grade, debounced])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const resetPage = () => setPage(1)

  return (
    <section aria-labelledby="marketplace-title" className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 id="marketplace-title" className="text-lg font-semibold">Live Marketplace</h2>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", isLive ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground")}>
              <span className={cn("size-1.5 rounded-full", isLive ? "animate-pulse bg-emerald-400" : "bg-muted-foreground")} aria-hidden />
              {isLive ? "Live feed" : "Paused"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleLive} aria-pressed={!isLive}>
            {isLive ? <Pause aria-hidden /> : <Play aria-hidden />}
            {isLive ? "Pause feed" : "Resume feed"}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); resetPage() }}>
          <TabsList className="h-auto w-full flex-wrap justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-none">{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="Search listings"
              placeholder="Search team, product code (e.g. Y4), notes…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage() }}
              className="pl-9"
            />
          </div>
          <Select value={region} onValueChange={(v) => { setRegion(v); resetPage() }}>
            <SelectTrigger aria-label="Filter by region" className="sm:w-44">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All regions</SelectItem>
              {OPERATING_AREAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              <SelectItem value="Home Office">Home Office (Canada)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={grade} onValueChange={(v) => { setGrade(v); resetPage() }}>
            <SelectTrigger aria-label="Filter by grade" className="sm:w-32">
              <SelectValue placeholder="All grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All grades</SelectItem>
              {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead className="pr-5 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-14">
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <SearchX className="size-6" aria-hidden />
                    <p className="text-sm">No listings match these filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((l) => {
                const mine = l.teamId === viewerId
                const hasContract = contractListingIds.has(l.id)
                const label = hasContract ? "View Contract" : mine ? "View Offers" : l.status === "CLOSED" ? "Closed" : "Negotiate"
                return (
                  <TableRow key={l.id} className={cn(l.isNew && "animate-row-flash", l.status === "CLOSED" && "opacity-60")}>
                    <TableCell className="pl-5"><StatusBadge status={l.status} /></TableCell>
                    <TableCell><TypeLabel type={l.type} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium">{teamLabel(l.teamId)}</span>
                      {mine && <span className="ml-1.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] font-semibold text-primary">YOU</span>}
                    </TableCell>
                    <TableCell className="max-w-56">
                      <p className="truncate text-sm font-medium">{l.type === "BUY" || l.type === "SELL" ? PRODUCT_INFO[l.product].name : l.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.unitPrice ? `$${l.unitPrice}/unit · ` : ""}{l.notes}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex size-7 items-center justify-center rounded-md bg-secondary font-mono text-xs font-bold">{l.product}{l.grade}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums whitespace-nowrap">
                      {l.quantity ? formatUnits(l.quantity) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{l.region}</TableCell>
                    <TableCell><DeliveryLabel mode={l.delivery} /></TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        size="sm"
                        variant={hasContract ? "default" : "secondary"}
                        disabled={!hasContract && !mine && l.status === "CLOSED"}
                        onClick={() => onOpen(l)}
                        aria-label={`${label}: ${l.title} by ${teamLabel(l.teamId)}`}
                      >
                        {hasContract ? <FileSignature aria-hidden /> : <MessagesSquare aria-hidden />}
                        {label}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <nav aria-label="Marketplace pagination" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
        <p className="text-xs text-muted-foreground">
          {filtered.length === 0 ? "0 results" : `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Previous page">
            <ChevronLeft aria-hidden />
          </Button>
          <span className="px-2 font-mono text-xs tabular-nums">{current} / {pageCount}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setPage(current + 1)} disabled={current === pageCount} aria-label="Next page">
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </nav>
    </section>
  )
})
