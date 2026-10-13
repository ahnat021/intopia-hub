"use client"

import { useState, useTransition, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Ban, Crown, KeyRound, Languages, Loader2, Lock, Mail, RotateCw, ShieldAlert, ShieldCheck } from "lucide-react"
import { reportNotMe } from "@/lib/actions/auth-actions"
import { officialEmail, activePeriodId } from "@/lib/constants"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TeamCombobox } from "@/components/team-combobox"
import { BrandMark } from "@/components/brand-mark"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { useI18n } from "@/lib/i18n"
import { OPERATING_AREAS, formatCompactUSD } from "@/lib/intopia-rules"
import { isBankrupt, isOperator, type Region } from "@/lib/domain"
import { cn } from "@/lib/utils"

const PIN_RE = /^\d{4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/

function PinInput({ id, value, onChange, autoFocus }: { id: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <Input
      id={id}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      placeholder="••••"
      className="h-11 text-center font-mono text-lg tracking-[0.6em]"
    />
  )
}

export async function requestCode(email: string, purpose: "team-register" | "admin-setup", teamId?: string) {
  try {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose, teamId }),
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    if (res.ok) return null
    const message = body.error ?? `We couldn't send the code (HTTP ${res.status}).`
    toast.error(message)
    return message
  } catch (error) {
    const message = `Network error: ${error instanceof Error ? error.message : "request failed"}`
    toast.error(message)
    return message
  }
}

function ReturningForm({ teamId }: { teamId: string }) {
  const { signIn } = useAuth()
  const { t } = useI18n()
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!PIN_RE.test(pin)) return setError("Enter your 4-digit PIN.")
    startTransition(async () => {
      try {
        const result = await signIn(teamId, pin)
        if (!result.ok) {
          setError(result.error)
          setPin("")
        }
      } catch (error) {
        const message = `Sign-in failed: ${error instanceof Error ? error.message : "server error"}`
        setError(message)
        toast.error(message)
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pin">{t("login.pin")}</Label>
        <PinInput id="pin" value={pin} onChange={(v) => { setPin(v); setError(null) }} autoFocus />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
        {t("login.enter")}
      </Button>
    </form>
  )
}

type SetupStep = "details" | "verify"

function SetupForm({ teamId }: { teamId: string }) {
  const { register } = useAuth()
  const { teamById } = useHub()
  const { t } = useI18n()
  const [step, setStep] = useState<SetupStep>("details")
  const [company, setCompany] = useState("")
  const [region, setRegion] = useState<Region | "">("")
  const [whatsapp, setWhatsapp] = useState("")
  const email = officialEmail(teamById[teamId]?.number ?? 0)
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  const errors = {
    company: company.trim().length < 2 ? "Enter your company name." : null,
    region: !region ? "Choose your home region." : null,
    whatsapp: !PHONE_RE.test(whatsapp.trim()) ? "Enter a valid WhatsApp number." : null,
    pin: !PIN_RE.test(pin) ? "PIN must be exactly 4 digits." : null,
    confirm: confirm !== pin ? "PINs do not match." : null,
  }
  const show = (key: keyof typeof errors) => submitted && errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>

  const send = () =>
    startTransition(async () => {
      const failure = await requestCode(email, "team-register", teamId)
      if (failure) return setError(failure)
      setError(null)
      setStep("verify")
      toast.success("Verification code sent", { description: email })
    })

  const notMe = () =>
    startTransition(async () => {
      const result = await reportNotMe(teamId)
      if (!result.ok) return void toast.error(result.error)
      toast.success("Unauthorized attempt reported", {
        description: "The code was invalidated and logins for this team are locked for 10 minutes.",
      })
      setStep("details")
      setCode("")
    })

  const dispatch = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    send()
  }

  const verify = (e: FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof register>>
      try {
        result = await register({ teamId, company: company.trim(), region, whatsapp: whatsapp.trim(), email, pin, code })
      } catch (error) {
        const message = `Registration failed: ${error instanceof Error ? error.message : "server error"}`
        toast.error(message)
        return setError(message)
      }
      if (!result.ok) return setError(result.error)
      toast.success("Email verified", { description: "Your registration is now in the KYC review queue." })
    })
  }

  if (step === "verify") {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium">
            <Mail className="size-3.5 text-primary" aria-hidden />
            {t("setup.codeSent")} {email}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("setup.codeHint")}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp">{t("setup.code")}</Label>
          <Input
            id="otp"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              setError(null)
            }}
            placeholder="000000"
            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
          />
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={code.length !== 6 || pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
          {t("setup.verify")}
        </Button>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => { setStep("details"); setCode(""); setError(null) }}>
            <ArrowLeft aria-hidden />
            {t("setup.edit")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={send} disabled={pending}>
            <RotateCw aria-hidden />
            {t("setup.resend")}
          </Button>
        </div>
        <button
          type="button"
          onClick={notMe}
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 self-center text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50"
        >
          <ShieldAlert className="size-3.5" aria-hidden />
          Not me? Report this login attempt
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={dispatch} className="flex flex-col gap-3.5" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">{t("setup.company")}</Label>
          <Input id="company" autoFocus value={company} maxLength={80} onChange={(e) => setCompany(e.target.value)} placeholder="Nordvik Industries" />
          {show("company")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="region">{t("setup.region")}</Label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              —
            </option>
            {OPERATING_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {show("region")}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp">{t("setup.whatsapp")}</Label>
          <Input id="whatsapp" type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1 555 123 4567" />
          {show("whatsapp")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("setup.email")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="email" type="email" value={email} readOnly disabled aria-describedby="email-lock-note" className="pl-9 font-mono" />
          </div>
          <p id="email-lock-note" className="text-xs text-muted-foreground">
            Locked to your official INTOPIA simulation inbox.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-pin">{t("setup.pin")}</Label>
          <PinInput id="new-pin" value={pin} onChange={setPin} />
          {show("pin")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-pin">{t("setup.confirm")}</Label>
          <PinInput id="confirm-pin" value={confirm} onChange={setConfirm} />
          {show("confirm")}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
        {pending ? t("setup.sending") : t("setup.send")}
      </Button>
      <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{t("setup.review")}</p>
    </form>
  )
}

export function LoginGate() {
  const { isRegistered } = useAuth()
  const { teams, teamById, approvedIds, kycQueue, settings, configured } = useHub()
  const { t, locale, toggle } = useI18n()
  const [selected, setSelected] = useState<string | null>(null)
  const team = selected ? teamById[selected] : null
  const pendingCount = teams.filter((x) => x.kyc === "pending").length || kycQueue.length

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <Image src="/images/globe-network.png" alt="" fill priority sizes="100vw" className="pointer-events-none object-cover opacity-20" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-background/75" />

      <nav aria-label="Preferences" className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggle} aria-label={t("lang.switch")}>
          <Languages aria-hidden />
          {locale === "en" ? "FR" : "EN"}
        </Button>
        <ThemeToggle />
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ShieldCheck aria-hidden />
            {t("nav.adminPortal")}
          </Link>
        </Button>
      </nav>

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur md:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="pick-team" className="flex flex-col gap-5 border-b border-border p-6 sm:p-8 md:border-r md:border-b-0">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11" />
            <div>
              <p className="text-xl font-semibold leading-tight">
                Intopia <span className="text-gold">Hub</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {activePeriodId(settings.period)} · {settings.tradingLocked ? "Contracts locked" : "Trading open"} · {teams.length || 75} {t("login.stats.teams").toLowerCase()}
              </p>
            </div>
          </div>
          <div>
            <h1 id="pick-team" className="text-balance text-3xl font-semibold tracking-tight">
              {t("login.select")}
            </h1>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">{t("login.selectHint")}</p>
          </div>

          {!configured && (
            <p role="status" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-foreground">
              {t("db.offline")}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-picker">{t("login.team")}</Label>
            <TeamCombobox
              id="team-picker"
              value={selected}
              onChange={setSelected}
              renderMeta={(x) =>
                isBankrupt(x) ? (
                  <span className="text-[10px] font-semibold uppercase text-destructive">Bankrupt</span>
                ) : x.banned ? (
                  <span className="text-[10px] font-semibold uppercase text-destructive">Removed</span>
                ) : x.kyc === "approved" ? (
                  <span className="text-[10px] font-semibold uppercase text-success">Active</span>
                ) : x.kyc === "pending" ? (
                  <span className="text-[10px] font-semibold uppercase text-warning">Pending</span>
                ) : null
              }
            />
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: t("login.stats.teams"), value: teams.length || 75 },
              { label: t("login.stats.verified"), value: approvedIds.length },
              { label: t("login.stats.review"), value: pendingCount },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-secondary/50 px-2 py-2.5">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</dt>
                <dd className="font-mono text-lg font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-live="polite" className="flex flex-col justify-center gap-5 p-6 sm:p-8">
          {!team ? (
            <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
              <Lock className="size-8" aria-hidden />
              <p className="text-sm">{t("login.choose")}</p>
            </div>
          ) : (
            <>
              <div className={cn("flex items-start justify-between gap-3", isOperator(team.id) && "operator-panel rounded-xl p-3")}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {isBankrupt(team) ? t("login.locked") : isRegistered(team.id) ? t("login.returning") : t("login.setup")}
                  </p>
                  <h2 className="flex items-center gap-2 text-2xl font-semibold">
                    {team.name}
                    {isOperator(team.id) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-gold">
                        <Crown className="size-3" aria-hidden />
                        {t("operator.badge")}
                      </span>
                    )}
                  </h2>
                  {team.company && (
                    <p className="text-sm text-muted-foreground">
                      {team.company}
                      {team.region && ` · ${team.region}`}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  <ArrowLeft aria-hidden />
                  {t("login.change")}
                </Button>
              </div>

              {isBankrupt(team) ? (
                <div role="alert" className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                  <p className="flex items-center gap-2 font-semibold text-destructive">
                    <Ban className="size-4" aria-hidden />
                    Bankruptcy lockout
                  </p>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Consolidated equity is <span className="font-mono text-destructive">{formatCompactUSD((team.equity ?? 0) * 1000)}</span>. Teams
                    with negative equity are locked out until the facilitator restructures the company.
                  </p>
                </div>
              ) : isRegistered(team.id) ? (
                <ReturningForm key={team.id} teamId={team.id} />
              ) : (
                <SetupForm key={team.id} teamId={team.id} />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
