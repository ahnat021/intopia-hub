"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, MessageSquare, Pause, Play, Search, SearchX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { REGIONS, TEAM_BY_ID, teamLabel, type Listing, type ListingStatus, type ListingType } from "@/lib/mock-data"
import { StatusBadge, TypeLabel } from "./listing-badges"

const PAGE_SIZE = 6

const TABS: { value: string; label: string; type?: ListingType }[] = [
  { value: "all", label: "All Listings" },
  { value: "buying", label: "Buying", type: "BUY" },
  { value: "selling", label: "Selling", type: "SELL" },
  { value: "partnerships", label: "Partnerships", type: "PARTNERSHIP" },
  { value: "rnd", label: "R&D / Licensing", type: "RND" },
]

const STATUS_PRIORITY: Record<ListingStatus, number> = { URGENT: 0, OPEN: 1, NEGOTIATING: 2, CLOSED: 3 }

type SortKey = "newest" | "priority" | "team"

const SORT_LABEL: Record<SortKey, string> = { newest: "Newest first", priority: "Urgent first", team: "By team" }

interface LiveMarketplaceProps {
  listings: Listing[]
  isLive: boolean
  onToggleLive: () => void
  onContact: (listing: Listing) => void
}

function useUrlState() {
  const searchParams = useSearchParams()

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key)
        else params.set(key, value)
      }
      const qs = params.toString()
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
    },
    [],
  )

  const tab = TABS.some((t) => t.value === searchParams.get("tab")) ? (searchParams.get("tab") as string) : "all"
  const region = searchParams.get("region") ?? "all"
  const sort = (["newest", "priority", "team"].includes(searchParams.get("sort") ?? "") ? searchParams.get("sort") : "newest") as SortKey
  const query = searchParams.get("q") ?? ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)

  return { tab, region, sort, query, page, setParams }
}

export function LiveMarketplace({ listings, isLive, onToggleLive, onContact }: LiveMarketplaceProps) {
  const { tab, region, sort, query, page, setParams } = useUrlState()
  const [searchInput, setSearchInput] = useState(query)
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    const committed = new URLSearchParams(window.location.search).get("q") ?? ""
    const next = debouncedSearch.trim()
    if (next !== committed) setParams({ q: next || null, page: null })
  }, [debouncedSearch, setParams])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: listings.length }
    for (const t of TABS) if (t.type) counts[t.value] = 0
    for (const l of listings) {
      const t = TABS.find((x) => x.type === l.type)
      if (t) counts[t.value]++
    }
    return counts
  }, [listings])

  const filtered = useMemo(() => {
    const activeType = TABS.find((t) => t.value === tab)?.type
    const needle = query.toLowerCase()
    const result = listings.filter((l) => {
      if (activeType && l.type !== activeType) return false
      if (region !== "all" && l.region !== region) return false
      if (!needle) return true
      const team = TEAM_BY_ID[l.teamId]
      return (
        l.product.toLowerCase().includes(needle) ||
        l.notes.toLowerCase().includes(needle) ||
        l.region.toLowerCase().includes(needle) ||
        teamLabel(l.teamId).toLowerCase().includes(needle) ||
        (team?.name.toLowerCase().includes(needle) ?? false)
      )
    })
    if (sort === "priority") {
      result.sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || b.createdAt - a.createdAt)
    } else if (sort === "team") {
      result.sort((a, b) => a.teamId.localeCompare(b.teamId) || b.createdAt - a.createdAt)
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt)
    }
    return result
  }, [listings, tab, region, query, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  )

  const goToPage = (p: number) => setParams({ page: p === 1 ? null : String(p) })
  const hasFilters = query !== "" || region !== "all" || tab !== "all"

  return (
    <section aria-labelledby="marketplace-title" className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 id="marketplace-title" className="text-lg font-semibold tracking-tight">
              Live Marketplace
            </h2>
            <button
              type="button"
              onClick={onToggleLive}
              aria-pressed={isLive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset transition-colors",
                isLive
                  ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-slate-500/15 text-slate-400 ring-slate-500/30 hover:bg-slate-500/25",
              )}
            >
              {isLive ? (
                <>
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                  <Pause className="size-3" aria-hidden />
                </>
              ) : (
                <>
                  Paused
                  <Play className="size-3" aria-hidden />
                </>
              )}
              <span className="sr-only">{isLive ? "Pause live updates" : "Resume live updates"}</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} matching listings</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v === "all" ? null : v, page: null })}>
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-secondary/60 p-1 sm:w-auto">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="shrink-0 gap-2 px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.label}
                <span className="rounded bg-black/20 px-1.5 font-mono text-[10px] tabular-nums">{tabCounts[t.value]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search team, product, region or notes…"
              aria-label="Search listings"
              className="bg-background/60 pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={region} onValueChange={(v) => setParams({ region: v === "all" ? null : v, page: null })}>
              <SelectTrigger aria-label="Filter by region" className="w-full bg-background/60 sm:w-40">
                <SelectValue>{region === "all" ? "All regions" : region}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setParams({ sort: v === "newest" ? null : v })}>
              <SelectTrigger aria-label="Sort listings" className="w-full bg-background/60 sm:w-40">
                <SelectValue>{SORT_LABEL[sort]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="priority">Urgent first</SelectItem>
                <SelectItem value="team">By team</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">No listings match your filters</p>
            <p className="text-sm text-muted-foreground">Try a different search term, tab or region.</p>
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchInput("")
                setParams({ q: null, region: null, tab: null, page: null })
              }}
            >
              <X className="size-4" aria-hidden />
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Needed By</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((listing) => (
              <ListingRow key={listing.id} listing={listing} onContact={onContact} />
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:px-5">
        <p className="text-muted-foreground" aria-live="polite">
          Showing{" "}
          <span className="font-medium text-foreground tabular-nums">
            {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
          </span>{" "}
          of <span className="font-medium text-foreground tabular-nums">{filtered.length}</span> listings
        </p>
        <nav aria-label="Marketplace pagination" className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pageNumbers(currentPage, pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === currentPage ? "default" : "ghost"}
                size="icon"
                className="size-8 font-mono text-xs tabular-nums"
                onClick={() => goToPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={currentPage === pageCount}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>
    </section>
  )
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, "…", total]
  if (current >= total - 2) return [1, "…", total - 3, total - 2, total - 1, total]
  return [1, "…", current - 1, current, current + 1, "…", total]
}

const ListingRow = memo(function ListingRow({
  listing,
  onContact,
}: {
  listing: Listing
  onContact: (listing: Listing) => void
}) {
  const team = TEAM_BY_ID[listing.teamId]
  const isClosed = listing.status === "CLOSED"
  return (
    <TableRow className={cn("group", listing.isNew && "animate-row-flash", isClosed && "opacity-60")}>
      <TableCell className="pl-5">
        <StatusBadge status={listing.status} />
      </TableCell>
      <TableCell>
        <TypeLabel type={listing.type} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono text-sm font-semibold">{teamLabel(listing.teamId)}</span>
          <span className="text-xs text-muted-foreground">{team?.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">{listing.product}</TableCell>
      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">{listing.quantity}</TableCell>
      <TableCell className="text-muted-foreground">{listing.region}</TableCell>
      <TableCell>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold">{listing.neededBy}</span>
      </TableCell>
      <TableCell className="max-w-56 truncate text-muted-foreground" title={listing.notes}>
        {listing.notes}
      </TableCell>
      <TableCell className="pr-5 text-right">
        <Button
          size="sm"
          variant="outline"
          disabled={isClosed}
          onClick={() => onContact(listing)}
          className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <MessageSquare className="size-3.5" aria-hidden />
          Contact
          <span className="sr-only"> {teamLabel(listing.teamId)} about {listing.product}</span>
        </Button>
      </TableCell>
    </TableRow>
  )
})

export function MarketplaceSkeleton() {
  return <div className="h-[640px] animate-pulse rounded-xl border border-border bg-card" aria-hidden />
}
