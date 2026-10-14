"use client"

import { activePeriodId, periodEndAt } from "@/lib/constants"
import type { ReactNode } from "react"
import Link from "next/link"
import { Clock, Crown, Lock, LogOut, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { formatHMS, useDeadline } from "@/hooks/use-countdown"
import { isOperator, type Team } from "@/lib/domain"
import { formatCompactUSD } from "@/lib/intopia-rules"
import { useHub } from "@/lib/hub-store"
import { useI18n } from "@/lib/i18n"

export function TopBar({ team, onSignOut, children }: { team: Team; onSignOut: () => void; children?: ReactNode }) {
  const { settings, lockedOut } = useHub()
  const { t, locale, toggle: toggleLocale } = useI18n()
  const remaining = useDeadline(periodEndAt(settings.period))
  const [h, m, s] = formatHMS(remaining ?? 0)
  const operator = isOperator(team.id)

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold",
              operator ? "operator-chip" : "bg-primary text-primary-foreground",
            )}
          >
            {team.number}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {team.name}
              {team.company && <span className="font-normal text-muted-foreground">· {team.company}</span>}
              {operator && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                  <Crown className="size-3" aria-hidden />
                  {t("operator.badge")}
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {team.region ?? "No region"}
              {team.equity != null && (
                <>
                  {" · Equity "}
                  <span className="font-mono text-foreground">{formatCompactUSD(team.equity * 1000)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold ring-1 ring-border">{activePeriodId(settings.period)}</span>
          <span
            role="timer"
            aria-label={t("period.timeLeft")}
            title={t("period.timeLeft")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums ring-1",
              lockedOut ? "bg-warning/10 text-warning ring-warning/30" : "bg-gold/10 text-foreground ring-gold/30",
            )}
          >
            {lockedOut ? <Lock className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
            {lockedOut ? "Locked" : remaining == null ? "Open" : `${h}:${m}:${s}`}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {children}
          <nav aria-label="Legal" className="flex items-center gap-3 px-1 text-xs font-medium text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
          </nav>
          <Button variant="outline" size="sm" onClick={toggleLocale} aria-label="Toggle language" className="font-mono text-xs">
            <span className={locale === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
            <span aria-hidden className="text-muted-foreground">|</span>
            <span className={locale === "fr" ? "text-primary" : "text-muted-foreground"}>FR</span>
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onSignOut} aria-label="Switch team">
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
