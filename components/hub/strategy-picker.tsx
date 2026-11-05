"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TEAM_STRATEGIES, type TeamStrategy } from "@/lib/domain"

const ENTRIES = Object.entries(TEAM_STRATEGIES) as [TeamStrategy, (typeof TEAM_STRATEGIES)[TeamStrategy]][]

export function StrategyPicker({ value, onChange, disabled }: { value: TeamStrategy | null; onChange: (v: TeamStrategy | null) => void; disabled?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium">Declared strategy (visible to every team)</legend>
      <div role="radiogroup" aria-label="Team strategy" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ENTRIES.map(([key, s]) => {
          const selected = value === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? null : key)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-md border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-gold bg-gold/10" : "border-border hover:bg-muted",
              )}
            >
              <span className="text-sm font-semibold">{s.label}</span>
              <span className="text-xs leading-snug text-muted-foreground">{s.hint}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function StrategyBadge({ strategy, className }: { strategy?: TeamStrategy | null; className?: string }) {
  if (!strategy || !TEAM_STRATEGIES[strategy]) return null
  return (
    <Badge variant="outline" className={cn("border-gold/50 text-gold", className)}>
      {TEAM_STRATEGIES[strategy].label}
    </Badge>
  )
}
