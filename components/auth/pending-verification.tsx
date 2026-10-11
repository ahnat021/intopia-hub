"use client"

import { CheckCircle2, Clock, Lock, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"

export function PendingVerification() {
  const { team, signOut } = useAuth()
  const { t } = useI18n()
  if (!team) return null

  const steps = [
    { label: "Email verified", detail: "Ownership of your team inbox is confirmed", state: "done" as const },
    { label: "KYC review", detail: "Waiting for the Hub Administrator", state: "active" as const },
    { label: "Trading access", detail: "Marketplace, negotiations and contracts", state: "locked" as const },
  ]

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <ShieldCheck className="size-7" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {team.name}
              {team.company && ` · ${team.company}`}
            </p>
            <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight">{t("pending.title")}</h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{t("pending.body")}</p>
          </div>
        </div>

        <ol className="flex flex-col gap-3" aria-label="Verification progress">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              {s.state === "done" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : s.state === "active" ? (
                <Clock className="mt-0.5 size-4 shrink-0 animate-pulse text-warning" aria-hidden />
              ) : (
                <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="truncate text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <Button variant="ghost" onClick={() => void signOut()}>
          <LogOut aria-hidden />
          {t("pending.signOut")}
        </Button>
      </div>
    </main>
  )
}
