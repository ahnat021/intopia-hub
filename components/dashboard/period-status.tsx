"use client"

import { activePeriodId, formatToronto, periodEndAt } from "@/lib/constants"
import { CalendarClock, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatHMS, useDeadline } from "@/hooks/use-countdown"
import { useHub } from "@/lib/hub-store"
import { useI18n } from "@/lib/i18n"

export function PeriodStatus() {
  const { settings } = useHub()
  const { t } = useI18n()
  const endAt = periodEndAt(settings.period)
  const remaining = useDeadline(endAt)
  const locked = settings.tradingLocked
  const isCritical = remaining != null && remaining > 0 && remaining <= 15 * 60
  const [h, m, s] = formatHMS(remaining ?? 0)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <section aria-label="Current period" className="flex flex-1 flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:min-w-[300px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current Period</p>
            <p className="mt-0.5 font-mono text-3xl font-bold leading-none">{activePeriodId(settings.period)}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
              locked ? "bg-warning/15 text-warning ring-warning/30" : "bg-success/15 text-success ring-success/30",
            )}
          >
            <span className="relative flex size-2">
              {!locked && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
              <span className={cn("relative inline-flex size-2 rounded-full", locked ? "bg-warning" : "bg-success")} />
            </span>
            {locked ? "Contracts Locked" : "Trading Open"}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" aria-hidden />
          {endAt ? `${t("period.endsAt")} · ${formatToronto(endAt)}` : t("period.noSchedule")}
        </p>
      </section>

      <section
        aria-label={t("period.timeLeft")}
        className={cn(
          "flex flex-col justify-center rounded-xl border p-4 sm:min-w-[230px]",
          isCritical ? "border-destructive/40 bg-destructive/10" : "border-gold/40 bg-gold/10",
        )}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {t("period.timeLeft")}
        </p>
        {remaining == null ? (
          <p className="mt-1 font-mono text-2xl font-semibold text-muted-foreground">--:--:--</p>
        ) : (
          <p
            role="timer"
            aria-live="off"
            aria-label={`${Number(h)} hours ${Number(m)} minutes ${Number(s)} seconds remaining`}
            className={cn("mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight", isCritical ? "text-destructive" : "text-foreground")}
          >
            {h}
            <span className="text-gold">:</span>
            {m}
            <span className="text-gold">:</span>
            {s}
          </p>
        )}
      </section>
    </div>
  )
}
