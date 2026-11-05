"use client"

import { ShieldCheck, Star } from "lucide-react"
import { averageRating, isProfessor, professorName, type Team } from "@/lib/domain"
import { useHub } from "@/lib/hub-store"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type PosterIdentity = { primary: string; companyName: string | null }

function posterIdentity(teamId: string, teams: Team[], locale: string): PosterIdentity {
  if (isProfessor(teamId)) return { primary: professorName(teamId), companyName: null }
  const team = teams.find((t) => t.id === teamId)
  const number = team?.number ?? (teamId.startsWith("t") ? Number(teamId.slice(1)) : null)
  const primary = number != null ? `${locale === "fr" ? "Équipe" : "Team"} ${number}` : teamId
  const name = team?.name?.trim()
  const isDefaultName = !name || /^team\s*\d+$/i.test(name)
  return { primary, companyName: isDefaultName ? null : name }
}

function useRatingText() {
  const { stats } = useHub()
  const { locale } = useI18n()
  return (teamId: string) => {
    const s = stats[teamId]
    return s?.ratingCount ? averageRating(s).toFixed(1) : locale === "fr" ? "Nouveau" : "New"
  }
}

/** Text form of the poster label, used for aria-labels and plain strings. */
export function useCounterpartyText() {
  const { teams } = useHub()
  const { locale } = useI18n()
  const ratingText = useRatingText()
  return (teamId: string) => {
    const { primary, companyName } = posterIdentity(teamId, teams, locale)
    return `${primary}${companyName ? ` (${companyName})` : ""} • ★ ${ratingText(teamId)}`
  }
}

/** Shows which team posted a listing: team number, company name when one has been set, and rating. */
export function CounterpartyLabel({ teamId, className }: { teamId: string; className?: string }) {
  const { teams } = useHub()
  const { locale } = useI18n()
  const ratingText = useRatingText()
  const { primary, companyName } = posterIdentity(teamId, teams, locale)
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-sm font-medium", className)}>
      <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden />
      <span className="whitespace-nowrap">{primary}</span>
      {companyName && (
        <span className="max-w-40 truncate font-normal text-muted-foreground" title={companyName}>
          {companyName}
        </span>
      )}
      <span aria-hidden className="text-muted-foreground">•</span>
      <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-xs tabular-nums">
        <Star className="size-3 fill-gold text-gold" aria-hidden />
        <span className="sr-only">Rating </span>
        {ratingText(teamId)}
      </span>
    </span>
  )
}
