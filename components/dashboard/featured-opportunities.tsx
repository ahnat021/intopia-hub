"use client"

import { useMemo } from "react"
import { ArrowRight, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LISTING_TYPE_LABEL, formatClock, teamLabel, type Listing } from "@/lib/domain"
import { formatCompactUSD } from "@/lib/intopia-rules"
import { TypeIcon } from "./listing-badges"

const listingValue = (l: Listing) => (l.quantity ?? 0) * 1000 * (l.unitPrice ?? 0)

/** Highlights the three largest open trades currently on the board. */
export function FeaturedOpportunities({ listings, onView }: { listings: Listing[]; onView: (listing: Listing) => void }) {
  const featured = useMemo(
    () =>
      listings
        .filter((l) => l.status === "OPEN" || l.status === "NEGOTIATING")
        .sort((a, b) => listingValue(b) - listingValue(a) || b.createdAt - a.createdAt)
        .slice(0, 3),
    [listings],
  )

  if (featured.length === 0) return null

  return (
    <section aria-labelledby="featured-title">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-gold" aria-hidden />
        <h2 id="featured-title" className="text-lg font-semibold tracking-tight">
          Featured Opportunities
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {featured.map((f) => {
          const value = listingValue(f)
          return (
            <article
              key={f.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <TypeIcon type={f.type} />
                  {LISTING_TYPE_LABEL[f.type]}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Clock className="size-3" aria-hidden />
                  {formatClock(f.createdAt)}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">{f.notes || f.region}</p>
              <div className="mt-4 flex items-end justify-between gap-2 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-lg font-bold tabular-nums">{value > 0 ? formatCompactUSD(value) : f.region}</p>
                  <p className="text-xs text-muted-foreground">{teamLabel(f.teamId)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onView(f)} className="group/btn">
                  Contact
                  <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" aria-hidden />
                  <span className="sr-only"> about {f.title}</span>
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
