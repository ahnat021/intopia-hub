import { memo } from "react"
import { FlaskConical, Handshake, Store, Users, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MetricsData {
  openListings: number
  teams: number
  partnerships: number
  rnd: number
}

interface MetricDef {
  key: keyof MetricsData
  label: string
  hint: string
  icon: LucideIcon
  tone: string
  glow: string
}

const METRICS: MetricDef[] = [
  { key: "openListings", label: "Open Marketplace Listings", hint: "Active buy & sell offers", icon: Store, tone: "text-sky-400 bg-sky-500/15", glow: "hover:border-sky-500/40" },
  { key: "teams", label: "Teams Participating", hint: "Across 3 regions", icon: Users, tone: "text-emerald-400 bg-emerald-500/15", glow: "hover:border-emerald-500/40" },
  { key: "partnerships", label: "Partnership Opportunities", hint: "JVs, alliances & deals", icon: Handshake, tone: "text-violet-400 bg-violet-500/15", glow: "hover:border-violet-500/40" },
  { key: "rnd", label: "R&D / Licensing Opportunities", hint: "Patents & joint research", icon: FlaskConical, tone: "text-amber-400 bg-amber-500/15", glow: "hover:border-amber-500/40" },
]

export const MetricsStrip = memo(function MetricsStrip({ data }: { data: MetricsData }) {
  return (
    <section aria-label="Market metrics" className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-4 lg:gap-4">
      {METRICS.map(({ key, label, hint, icon: Icon, tone, glow }) => (
        <article
          key={key}
          className={cn(
            "group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/60 hover:shadow-lg hover:shadow-black/20 sm:p-5",
            glow,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-pretty text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110", tone)}>
              <Icon className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{data[key]}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </article>
      ))}
    </section>
  )
})
