"use client"

import type { ReactNode } from "react"
import { Clock, Lock, LogOut, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatHMS, useCountdown } from "@/hooks/use-countdown"
import { CURRENT_PERIOD, SIM_DEADLINE_SECONDS, SIM_START_SECONDS, type Team } from "@/lib/mock-data"
import { formatCompactUSD } from "@/lib/intopia-rules"

export function TopBar({
  team,
  lockedOut,
  onSignOut,
  children,
}: {
  team: Team
  lockedOut: boolean
  onSignOut: () => void
  children?: ReactNode
}) {
  const remaining = useCountdown(SIM_DEADLINE_SECONDS - SIM_START_SECONDS)
  const [h, m, s] = formatHMS(remaining)

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            {team.number}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">
              {team.name} <span className="font-normal text-muted-foreground">· {team.company}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {team.region} · Equity <span className="font-mono text-foreground">{formatCompactUSD(team.equity * 1000)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold ring-1 ring-border">{CURRENT_PERIOD}</span>
          <span
            role="timer"
            aria-label="Time until deadline"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums ring-1",
              lockedOut ? "bg-amber-500/10 text-amber-300 ring-amber-500/30" : "bg-primary/10 text-foreground ring-primary/30",
            )}
          >
            {lockedOut ? <Lock className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
            {lockedOut ? "Locked" : `${h}:${m}:${s}`}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {children}
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <Repeat aria-hidden />
            <span className="hidden sm:inline">Switch Team</span>
            <span className="sr-only sm:hidden">Switch team</span>
            <LogOut className="hidden sm:block" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
