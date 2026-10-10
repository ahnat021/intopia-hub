import { ArrowRight, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FEATURED, LISTING_TYPE_LABEL, TEAM_BY_ID, teamLabel, type FeaturedOpportunity } from "@/lib/mock-data"
import { TypeIcon } from "./listing-badges"

export function FeaturedOpportunities({ onView }: { onView: (opportunity: FeaturedOpportunity) => void }) {
  return (
    <section aria-labelledby="featured-title">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-amber-400" aria-hidden />
        <h2 id="featured-title" className="text-lg font-semibold tracking-tight">
          Featured Opportunities
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURED.map((f) => (
          <article
            key={f.id}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100 md:opacity-0"
            />
            <div className="relative flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <TypeIcon type={f.type} />
                {LISTING_TYPE_LABEL[f.type]}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Clock className="size-3" aria-hidden />
                {f.closesIn}
              </span>
            </div>
            <h3 className="relative mt-3 text-base font-semibold">{f.title}</h3>
            <p className="relative mt-1 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            <div className="relative mt-4 flex items-end justify-between gap-2 border-t border-border pt-4">
              <div>
                <p className="font-mono text-lg font-bold tabular-nums">{f.value}</p>
                <p className="text-xs text-muted-foreground">
                  {teamLabel(f.teamId)} · {TEAM_BY_ID[f.teamId]?.name}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onView(f)} className="group/btn">
                Contact
                <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" aria-hidden />
                <span className="sr-only"> about {f.title}</span>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
