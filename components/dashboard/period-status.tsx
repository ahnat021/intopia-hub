"use client"

import { Clock, Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatHMS, useCountdown } from "@/hooks/use-countdown"
import { CURRENT_PERIOD, LOCKOUT_SECONDS, SIM_DEADLINE_SECONDS, SIM_START_SECONDS } from "@/lib/mock-data"

const TOTAL_SECONDS = SIM_DEADLINE_SECONDS - SIM_START_SECONDS

const MILESTONES = [
  { label: "Now", detail: "Trading open", at: SIM_START_SECONDS, dot: "bg-emerald-400", ring: "ring-emerald-400/30" },
  { label: "8:15 PM", detail: "Offers due", at: 20 * 3600 + 15 * 60, dot: "bg-sky-400", ring: "ring-sky-400/30" },
  { label: "8:30 PM", detail: "Contracts lock", at: 20 * 3600 + 30 * 60, dot: "bg-amber-400", ring: "ring-amber-400/30" },
  { label: "9:00 PM", detail: "Period close", at: SIM_DEADLINE_SECONDS, dot: "bg-rose-400", ring: "ring-rose-400/30" },
]

/** Milestones are evenly spaced visually; progress is interpolated within each segment. */
function timelinePercent(simNow: number) {
  const segments = MILESTONES.length - 1
  for (let i = 0; i < segments; i++) {
    const a = MILESTONES[i].at
    const b = MILESTONES[i + 1].at
    if (simNow <= b) return ((i + Math.max(0, (simNow - a) / (b - a))) / segments) * 100
  }
  return 100
}

export function PeriodStatus({ lockedOut, onToggleLockout }: { lockedOut: boolean; onToggleLockout: () => void }) {
  const remaining = useCountdown(TOTAL_SECONDS)
  const [h, m, s] = formatHMS(remaining)
  const simNow = lockedOut ? LOCKOUT_SECONDS : SIM_DEADLINE_SECONDS - remaining
  const progress = timelinePercent(simNow)
  const isClosed = remaining === 0
  const isCritical = remaining > 0 && remaining <= 15 * 60

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <section
        aria-label="Current period"
        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:min-w-[340px]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current Period</p>
            <p className="mt-0.5 font-mono text-3xl font-bold leading-none">{CURRENT_PERIOD}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
              isClosed
                ? "bg-rose-500/15 text-rose-400 ring-rose-500/30"
                : lockedOut
                  ? "bg-amber-500/15 text-amber-400 ring-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
            )}
          >
            <span className="relative flex size-2">
              {!isClosed && !lockedOut && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={cn("relative inline-flex size-2 rounded-full", isClosed ? "bg-rose-400" : lockedOut ? "bg-amber-400" : "bg-emerald-400")} />
            </span>
            {isClosed ? "Trading Closed" : lockedOut ? "Contracts Locked" : "Trading Open"}
          </span>
        </div>

        <div className="mt-5 px-1 pb-1">
          <div className="relative h-1.5 rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
            {MILESTONES.map((ms, i) => (
              <span
                key={ms.label}
                title={`${ms.label} — ${ms.detail}`}
                className={cn(
                  "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4",
                  ms.dot,
                  ms.ring,
                )}
                style={{ left: `${(i / (MILESTONES.length - 1)) * 100}%` }}
              />
            ))}
            <span
              aria-hidden
              className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_2px] shadow-white/60 transition-[left] duration-1000 ease-linear"
              style={{ left: `${progress}%` }}
            />
          </div>
          <ol className="mt-3 grid grid-cols-4 text-[11px]">
            {MILESTONES.map((ms, i) => (
              <li
                key={ms.label}
                className={cn(
                  "flex flex-col",
                  i === 0 && "items-start",
                  i > 0 && i < MILESTONES.length - 1 && "items-center",
                  i === MILESTONES.length - 1 && "items-end",
                )}
              >
                <span className="font-semibold text-foreground">{ms.label}</span>
                <span className="text-muted-foreground">{ms.detail}</span>
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          onClick={onToggleLockout}
          aria-pressed={lockedOut}
          className={cn(
            "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
            lockedOut
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
          )}
        >
          {lockedOut ? <Unlock className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
          {lockedOut ? "Reopen Trading (demo)" : "Simulate 8:30 PM Lockout"}
        </button>
      </section>

      <section
        aria-label="Time until deadline"
        className={cn(
          "flex flex-col justify-center rounded-xl border p-4 backdrop-blur-md sm:min-w-[230px]",
          isCritical ? "border-rose-500/40 bg-rose-500/10" : "border-primary/30 bg-primary/10",
        )}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          Time Until Deadline
        </p>
        <p
          role="timer"
          aria-live="off"
          aria-label={`${Number(h)} hours ${Number(m)} minutes ${Number(s)} seconds remaining`}
          className={cn(
            "mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-[2.6rem]",
            isCritical ? "text-rose-400" : "text-foreground",
          )}
        >
          {h}
          <span className="animate-pulse text-primary">:</span>
          {m}
          <span className="animate-pulse text-primary">:</span>
          {s}
        </p>
        <p className="text-xs text-muted-foreground">Period closes at 9:00 PM</p>
      </section>
    </div>
  )
}
