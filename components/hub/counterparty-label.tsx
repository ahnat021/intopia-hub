"use client"

import { ShieldCheck, Star } from "lucide-react"
import { averageRating } from "@/lib/domain"
import { useHub } from "@/lib/hub-store"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/** Text form of the blind label, used for aria-labels and plain strings. */
export function useCounterpartyText() {
  const { stats } = useHub()
  const { locale } = useI18n()
  return (teamId: string) => {
    const s = stats[teamId]
    const rating = s?.ratingCount ? averageRating(s).toFixed(1) : locale === "fr" ? "Nouveau" : "New"
    return `${locale === "fr" ? "Contrepartie Vérifiée" : "Verified Counterparty"} • ★ ${rating}`
  }
}

/** Public listings never reveal the poster's team; identity is revealed once a negotiation is opened. */
export function CounterpartyLabel({ teamId, className }: { teamId: string; className?: string }) {
  const { stats } = useHub()
  const { locale } = useI18n()
  const s = stats[teamId]
  const rating = s?.ratingCount ? averageRating(s).toFixed(1) : locale === "fr" ? "Nouveau" : "New"
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium", className)}>
      <ShieldCheck className="size-3.5 text-success" aria-hidden />
      {locale === "fr" ? "Contrepartie Vérifiée" : "Verified Counterparty"}
      <span aria-hidden className="text-muted-foreground">•</span>
      <span className="inline-flex items-center gap-0.5 font-mono text-xs tabular-nums">
        <Star className="size-3 fill-gold text-gold" aria-hidden />
        <span className="sr-only">Rating </span>
        {rating}
      </span>
    </span>
  )
}
