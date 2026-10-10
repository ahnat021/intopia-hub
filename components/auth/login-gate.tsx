"use client"

import { useMemo, useState, type FormEvent } from "react"
import Image from "next/image"
import { ArrowLeft, BadgeCheck, Ban, Globe2, KeyRound, Lock, Mail, MessageCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { isBankrupt, useAuth } from "@/lib/auth-context"
import { TEAMS, TEAM_BY_ID, teamIdFor } from "@/lib/mock-data"
import { formatCompactUSD } from "@/lib/intopia-rules"

const PIN_RE = /^\d{4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+\d[\d\s-]{6,17}$/

function resolveTeamId(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const num = q.match(/^(?:team\s*|t)?(\d{1,2})$/)
  if (num) {
    const id = teamIdFor(Number(num[1]))
    return TEAM_BY_ID[id] ? id : null
  }
  return TEAMS.find((t) => t.company.toLowerCase() === q || t.name.toLowerCase() === q)?.id ?? null
}

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

function ReturningForm({ teamId }: { teamId: string }) {
  const { signIn } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!PIN_RE.test(pin)) return setError("Enter your 4-digit PIN.")
    const result = signIn(teamId, pin)
    if (result === "bad-pin") {
      setError("Incorrect PIN. Try again.")
      setPin("")
    } else if (result === "banned") {
      setError("This team has been removed from the hub by the administrator.")
      setPin("")
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pin">4-digit team PIN</Label>
        <PinInput id="pin" value={pin} onChange={(v) => { setPin(v); setError(null) }} autoFocus />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full">
        <KeyRound aria-hidden />
        Enter the Hub
      </Button>
    </form>
  )
}

function SetupForm({ teamId }: { teamId: string }) {
  const { register } = useAuth()
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const emailVerified = verifiedEmail !== null && verifiedEmail === email.trim().toLowerCase()
  const errors = {
    pin: !PIN_RE.test(pin) ? "PIN must be exactly 4 digits." : null,
    confirm: confirm !== pin ? "PINs do not match." : null,
    email: !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : !emailVerified ? "Verify this email to continue." : null,
    whatsapp: !PHONE_RE.test(whatsapp.trim()) ? "Use international format, e.g. +1 416 555 0142." : null,
  }
  const show = (key: keyof typeof errors) => submitted && errors[key]

  const sendCode = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setSubmitted(true)
      return
    }
    const generated = String(Math.floor(100000 + Math.random() * 900000))
    setSentCode(generated)
    setCode("")
    toast.info("Verification code sent", { description: `Demo inbox for ${email.trim()}: ${generated}` })
  }

  const verify = () => {
    if (code.trim() === sentCode) {
      setVerifiedEmail(email.trim().toLowerCase())
      toast.success("Email verified")
    } else {
      toast.error("That code doesn't match")
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    register({ teamId, pin, email: email.trim(), whatsapp: whatsapp.trim() })
    toast.success(`Welcome, ${TEAM_BY_ID[teamId].name}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-pin">Set 4-digit PIN</Label>
          <PinInput id="new-pin" value={pin} onChange={setPin} autoFocus />
          {show("pin") && <p className="text-xs text-destructive">{errors.pin}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-pin">Confirm PIN</Label>
          <PinInput id="confirm-pin" value={confirm} onChange={setConfirm} />
          {show("confirm") && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="flex items-center gap-1.5">
          <Mail className="size-3.5 text-muted-foreground" aria-hidden />
          Team contact email
          {emailVerified && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-success">
              <BadgeCheck className="size-3.5" aria-hidden /> Verified
            </span>
          )}
        </Label>
        <div className="flex gap-2">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@university.edu" />
          <Button type="button" variant="secondary" onClick={sendCode} disabled={emailVerified}>
            {sentCode ? "Resend" : "Send code"}
          </Button>
        </div>
        {sentCode && !emailVerified && (
          <div className="flex gap-2">
            <Input
              aria-label="6-digit verification code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className="font-mono tracking-widest"
            />
            <Button type="button" onClick={verify} disabled={code.length !== 6}>Verify</Button>
          </div>
        )}
        {show("email") && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5 text-muted-foreground" aria-hidden />
          Primary WhatsApp number
        </Label>
        <Input id="whatsapp" type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1 416 555 0142" />
        {show("whatsapp") && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full">
        <ShieldCheck aria-hidden />
        Create team account
      </Button>
    </form>
  )
}

export function LoginGate() {
  const { findAccount } = useAuth()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const matched = useMemo(() => resolveTeamId(query), [query])
  const team = selected ? TEAM_BY_ID[selected] : null
  const account = selected ? findAccount(selected) : undefined

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <Image src="/images/globe-network.png" alt="" fill priority sizes="100vw" className="pointer-events-none object-cover opacity-25" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-background/70" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl shadow-black/40 backdrop-blur md:grid-cols-[1.15fr_1fr]">
        <section aria-labelledby="pick-team" className="flex flex-col gap-5 border-b border-border p-6 md:border-r md:border-b-0 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Globe2 className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">Intopia <span className="text-primary">Hub</span></p>
              <p className="text-xs text-muted-foreground">Period 4 · Trading open</p>
            </div>
          </div>
          <div>
            <h1 id="pick-team" className="text-balance text-2xl font-bold tracking-tight">Select your team</h1>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              Enter a Team ID or pick from the roster. Demo: <span className="font-mono text-foreground">Team 7</span> or{" "}
              <span className="font-mono text-foreground">Team 18</span>, PIN <span className="font-mono text-foreground">1234</span>.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (matched) setSelected(matched)
            }}
            className="flex gap-2"
          >
            <Input aria-label="Team ID or name" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Team 12 or 12" />
            <Button type="submit" variant="secondary" disabled={!matched}>Continue</Button>
          </form>

          <ul className="grid grid-cols-5 gap-2" aria-label="Team roster">
            {TEAMS.map((t) => {
              const bankrupt = t.equity < 0
              const registered = !!findAccount(t.id)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.id)}
                    aria-pressed={selected === t.id}
                    aria-label={`${t.name}${registered ? ", registered" : ""}${bankrupt ? ", bankrupt" : ""}`}
                    className={cn(
                      "relative flex h-11 w-full items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-colors",
                      selected === t.id
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-border bg-secondary/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      bankrupt && "text-destructive/80 line-through",
                    )}
                  >
                    {t.number}
                    {registered && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-success" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" aria-hidden />Registered</span>
            <span className="line-through">Bankrupt (equity &lt; 0)</span>
          </p>
        </section>

        <section aria-live="polite" className="flex flex-col justify-center gap-5 p-6 sm:p-8">
          {!team ? (
            <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
              <Lock className="size-8" aria-hidden />
              <p className="text-sm">Choose a team to sign in or complete first-time setup.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {isBankrupt(team.id) ? "Locked" : account ? "Returning team" : "First-time setup"}
                  </p>
                  <h2 className="text-xl font-bold">{team.name}</h2>
                  <p className="text-sm text-muted-foreground">{team.company} · {team.region}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  <ArrowLeft aria-hidden />
                  Change
                </Button>
              </div>

              {isBankrupt(team.id) ? (
                <div role="alert" className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                  <p className="flex items-center gap-2 font-semibold text-destructive">
                    <Ban className="size-4" aria-hidden />
                    Bankruptcy lockout
                  </p>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Consolidated equity is <span className="font-mono text-destructive">{formatCompactUSD(team.equity * 1000)}</span>.
                    Teams with negative equity are locked out of the hub until the Market Admin restructures the company.
                  </p>
                </div>
              ) : account ? (
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
