"use client"

import { useState } from "react"
import { BookOpen, Factory, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FACTORY_RULES, MAX_FACTORIES_PER_AREA, OPERATING_AREAS, PRODUCTS, RULE_SECTIONS, type Product, type Region } from "@/lib/intopia-rules"

type Plan = Record<Region, Record<Product, { existing: number; planned: number }>>

const INITIAL_PLAN: Plan = {
  "North America": { X: { existing: 2, planned: 0 }, Y: { existing: 1, planned: 0 } },
  Europe: { X: { existing: 1, planned: 0 }, Y: { existing: 0, planned: 0 } },
  China: { X: { existing: 3, planned: 0 }, Y: { existing: 1, planned: 0 } },
}

function FactoryPlanner() {
  const [plan, setPlan] = useState(INITIAL_PLAN)
  const adjust = (r: Region, p: Product, delta: number) =>
    setPlan((prev) => {
      const cell = prev[r][p]
      const planned = Math.max(0, Math.min(MAX_FACTORIES_PER_AREA - cell.existing, cell.planned + delta))
      return { ...prev, [r]: { ...prev[r], [p]: { ...cell, planned } } }
    })

  return (
    <section aria-labelledby="planner-title" className="flex flex-col gap-3">
      <h3 id="planner-title" className="flex items-center gap-2 text-sm font-semibold">
        <Factory className="size-4 text-primary" aria-hidden />
        Factory planner
      </h3>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Max {MAX_FACTORIES_PER_AREA} X and {MAX_FACTORIES_PER_AREA} Y factories per area. Factories cannot be retooled between products.
      </p>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {OPERATING_AREAS.map((r) => (
          <div key={r} className="flex flex-col gap-2 p-3">
            <p className="text-sm font-medium">{r}</p>
            {PRODUCTS.map((p) => {
              const cell = plan[r][p]
              const total = cell.existing + cell.planned
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-6 font-mono text-xs font-bold">{p}</span>
                  <div className="flex flex-1 gap-1" aria-hidden>
                    {Array.from({ length: MAX_FACTORIES_PER_AREA }, (_, i) => (
                      <span key={i} className={i < cell.existing ? "h-2 flex-1 rounded-full bg-primary" : i < total ? "h-2 flex-1 rounded-full bg-amber-400" : "h-2 flex-1 rounded-full bg-secondary"} />
                    ))}
                  </div>
                  <span className="w-10 text-right font-mono text-xs tabular-nums">{total}/{MAX_FACTORIES_PER_AREA}</span>
                  <Button variant="ghost" size="icon-xs" onClick={() => adjust(r, p, -1)} disabled={cell.planned === 0} aria-label={`Remove planned ${p} factory in ${r}`}>
                    <Minus aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => adjust(r, p, 1)} disabled={total >= MAX_FACTORIES_PER_AREA} aria-label={`Plan ${p} factory in ${r}`}>
                    <Plus aria-hidden />
                  </Button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
        {PRODUCTS.map((p) => (
          <li key={p}><span className="font-mono font-semibold text-foreground">{p}</span> · builds in {FACTORY_RULES[p].build} — {FACTORY_RULES[p].note}.</li>
        ))}
        <li className="flex items-center gap-3 pt-1">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" aria-hidden />Existing</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" aria-hidden />Planned</span>
        </li>
      </ul>
    </section>
  )
}

export function RulebookSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen aria-hidden />
          Rulebook
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Official INTOPIA rules</SheetTitle>
          <SheetDescription>Every hub form enforces these constraints for the practice round.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          {RULE_SECTIONS.map((s) => (
            <section key={s.title} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">{s.title}</h3>
              <ul className="flex flex-col gap-1.5">
                {s.rules.map((r) => (
                  <li key={r} className="flex gap-2 text-sm leading-relaxed">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <FactoryPlanner />
        </div>
      </SheetContent>
    </Sheet>
  )
}
