"use client"

import { memo, useMemo } from "react"
import {
  Activity,
  Award,
  MapPin,
  CircleDollarSign,
  FlaskConical,
  Handshake,
  Megaphone,
  Radio,
  Store,
  TrendingDown,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ANNOUNCEMENTS,
  LEADERBOARD,
  TEAM_BY_ID,
  TOP_PARTNERS,
  formatSimClock,
  teamLabel,
  type ActivityKind,
  type ActivityLog,
  type AnnouncementTag,
  type Listing,
} from "@/lib/mock-data"

function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string
  icon: LucideIcon
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const id = `panel-${title.toLowerCase().replace(/\W+/g, "-")}`
  return (
    <section aria-labelledby={id} className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id={id} className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-primary" aria-hidden />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const PULSE_PRODUCTS = ["Product X", "Product Y"] as const

type DemandLabel = "High Demand" | "Balanced" | "Oversupplied"

const DEMAND_STYLE: Record<DemandLabel, string> = {
  "High Demand": "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  Balanced: "bg-slate-400/15 text-slate-300 ring-slate-400/30",
  Oversupplied: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
}

function demandLabel(buyers: number, sellers: number): DemandLabel {
  if (buyers >= Math.max(1, sellers) * 2) return "High Demand"
  if (sellers >= Math.max(1, buyers) * 2) return "Oversupplied"
  return "Balanced"
}

export const MarketPulse = memo(function MarketPulse({ listings }: { listings: Listing[] }) {
  const { products, topRegion } = useMemo(() => {
    const stats = PULSE_PRODUCTS.map((name) => ({ name, buyers: new Set<string>(), sellers: new Set<string>() }))
    const regions = new Map<string, number>()
    for (const l of listings) {
      if (l.status === "CLOSED") continue
      if (l.region !== "Global") regions.set(l.region, (regions.get(l.region) ?? 0) + 1)
      const stat = stats.find((s) => l.product.startsWith(s.name))
      if (!stat) continue
      if (l.type === "BUY") stat.buyers.add(l.teamId)
      else if (l.type === "SELL") stat.sellers.add(l.teamId)
    }
    let top: [string, number] = ["—", 0]
    for (const entry of regions) if (entry[1] > top[1]) top = entry
    return {
      products: stats.map((s) => ({ name: s.name, buyers: s.buyers.size, sellers: s.sellers.size })),
      topRegion: top,
    }
  }, [listings])

  return (
    <Panel title="Market Pulse" icon={Activity}>
      <ul className="flex flex-col gap-4 px-4 py-4">
        {products.map((p) => {
          const label = demandLabel(p.buyers, p.sellers)
          const total = Math.max(1, p.buyers + p.sellers)
          return (
            <li key={p.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{p.name}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset", DEMAND_STYLE[label])}>
                  {label}
                </span>
              </div>
              <div
                className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${p.buyers} active buyers versus ${p.sellers} active sellers`}
              >
                <div className="h-full bg-emerald-400 transition-[width] duration-500" style={{ width: `${(p.buyers / total) * 100}%` }} />
                <div className="h-full bg-rose-400 transition-[width] duration-500" style={{ width: `${(p.sellers / total) * 100}%` }} />
              </div>
              <div className="flex justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
                <span>
                  <span className="text-emerald-400">{p.buyers}</span> active buyers
                </span>
                <span>
                  <span className="text-rose-400">{p.sellers}</span> active sellers
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-primary" aria-hidden />
          Most Active Region
        </span>
        <span className="text-sm">
          <span className="font-semibold">{topRegion[0]}</span>{" "}
          <span className="font-mono text-xs tabular-nums text-muted-foreground">· {topRegion[1]} active listings</span>
        </span>
      </div>
    </Panel>
  )
})

const ACTIVITY_META: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  listing: { icon: Store, tone: "bg-sky-500/15 text-sky-400" },
  deal: { icon: CircleDollarSign, tone: "bg-emerald-500/15 text-emerald-400" },
  partnership: { icon: Handshake, tone: "bg-violet-500/15 text-violet-400" },
  license: { icon: FlaskConical, tone: "bg-amber-500/15 text-amber-400" },
  announcement: { icon: Megaphone, tone: "bg-rose-500/15 text-rose-400" },
}

export const ActivityFeed = memo(function ActivityFeed({ activity }: { activity: ActivityLog[] }) {
  return (
    <Panel
      title="Recent Activity"
      icon={Radio}
      action={
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          Live
        </span>
      }
    >
      <ol className="max-h-[360px] divide-y divide-border overflow-y-auto" aria-live="polite" aria-relevant="additions">
        {activity.map((a) => {
          const { icon: Icon, tone } = ACTIVITY_META[a.kind]
          return (
            <li key={a.id} className={cn("flex gap-3 px-4 py-3", a.isNew && "animate-row-flash")}>
              <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", tone)} aria-hidden>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-pretty text-sm leading-snug">{a.message}</p>
                <time className="font-mono text-[11px] text-muted-foreground">{formatSimClock(a.at)}</time>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
})

const TAG_STYLE: Record<AnnouncementTag, string> = {
  Official: "bg-primary/15 text-primary ring-primary/30",
  Reminder: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  Community: "bg-violet-500/15 text-violet-400 ring-violet-500/30",
}

export function Announcements() {
  return (
    <Panel title="Announcements" icon={Megaphone}>
      <ul className="divide-y divide-border">
        {ANNOUNCEMENTS.map((n) => (
          <li key={n.id} className="px-4 py-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset", TAG_STYLE[n.tag])}>
                {n.tag}
              </span>
              <time className="font-mono text-[11px] text-muted-foreground">{formatSimClock(n.at)}</time>
            </div>
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{n.body}</p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

const RANK_STYLE = [
  "bg-amber-400/20 text-amber-300 ring-amber-400/40",
  "bg-slate-300/15 text-slate-200 ring-slate-300/30",
  "bg-orange-500/15 text-orange-300 ring-orange-500/30",
]

export function Leaderboard() {
  return (
    <Panel title="Most Trusted Teams" icon={Trophy}>
      <ol className="divide-y divide-border">
        {LEADERBOARD.map((entry, i) => {
          const team = TEAM_BY_ID[entry.teamId]
          return (
            <li key={entry.teamId} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ring-1 ring-inset",
                  RANK_STYLE[i] ?? "bg-secondary text-muted-foreground ring-border",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <span className="font-mono">{teamLabel(entry.teamId)}</span>{" "}
                  <span className="text-muted-foreground">{team?.name}</span>
                </p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400" style={{ width: `${entry.score}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-sm font-bold tabular-nums">{entry.score}</span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-mono text-[10px] tabular-nums",
                    entry.delta > 0 ? "text-emerald-400" : entry.delta < 0 ? "text-rose-400" : "text-muted-foreground",
                  )}
                >
                  {entry.delta > 0 ? <TrendingUp className="size-3" aria-hidden /> : entry.delta < 0 ? <TrendingDown className="size-3" aria-hidden /> : null}
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta === 0 ? "—" : entry.delta}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

export function TopPartners() {
  return (
    <Panel title="Top Partners" icon={Award}>
      <ul className="divide-y divide-border">
        {TOP_PARTNERS.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {p.teams.map((t) => (
                  <span
                    key={t}
                    className="flex size-9 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-primary ring-2 ring-card"
                  >
                    {teamLabel(t)}
                  </span>
                ))}
              </div>
              <span className="sr-only">
                {p.teams.map((t) => TEAM_BY_ID[t]?.name).join(" and ")}
              </span>
              <span className="text-xs text-muted-foreground">{p.deals} deals</span>
            </div>
            <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">{p.volume}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
