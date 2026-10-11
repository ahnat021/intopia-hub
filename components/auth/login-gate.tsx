"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { ArrowLeft, Ban, Globe2, KeyRound, Loader2, Lock, Mail, ShieldCheck, Wrench } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TeamCombobox } from "@/components/team-combobox"
import { isBankrupt, useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { TEAM_BY_ID, TEAM_COUNT } from "@/lib/mock-data"
import { formatCompactUSD } from "@/lib/intopia-rules"

const PIN_RE = /^\d{4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DEV_BYPASS_CODE = "123456"

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

type SetupStep = "details" | "sending" | "verify"

function SetupForm({ teamId }: { teamId: string }) {
  const { register } = useAuth()
  const team = TEAM_BY_ID[teamId]
  const [step, setStep] = useState<SetupStep>("details")
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [email, setEmail] = useState("")
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const errors = {
    pin: !PIN_RE.test(pin) ? "PIN must be exactly 4 digits." : null,
    confirm: confirm !== pin ? "PINs do not match." : null,
    email: !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : null,
  }
  const show = (key: keyof typeof errors) => submitted && errors[key]

  const dispatchCode = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    setStep("sending")
    const generated = String(Math.floor(100000 + Math.random() * 900000))
    const toastId = toast.loading("Dispatching secure code...", { description: email.trim() })
    window.setTimeout(() => {
      setSentCode(generated)
      setStep("verify")
      toast.success("Secure code delivered", { id: toastId, description: `Simulated inbox for ${email.trim()}: ${generated}` })
    }, 1400)
  }

  const verify = (e: FormEvent) => {
    e.preventDefault()
    if (code !== sentCode && code !== DEV_BYPASS_CODE) {
      setCodeError("That code doesn't match. Check your inbox or resend.")
      return
    }
    register({ teamId, pin, email: email.trim(), whatsapp: team.whatsapp })
    toast.success("Email verified", { description: "Your account is now in the KYC review queue." })
  }

  if (step === "verify") {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium">
            <Mail className="size-3.5 text-primary" aria-hidden />
            Code sent to {email.trim()}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">Enter the 6-digit code to verify ownership of this inbox.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp">6-digit verification code</Label>
          <Input
            id="otp"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              setCodeError(null)
            }}
            placeholder="000000"
            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
          />
          {codeError && <p role="alert" className="text-xs text-destructive">{codeError}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={code.length !== 6}>
          <ShieldCheck aria-hidden />
          Verify &amp; submit for review
        </Button>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => { setStep("details"); setCode("") }}>
            <ArrowLeft aria-hidden />
            Edit details
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCode(DEV_BYPASS_CODE)
              setCodeError(null)
            }}
            className="border-dashed font-mono text-xs"
          >
            <Wrench aria-hidden />
            Developer Bypass: {DEV_BYPASS_CODE}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={dispatchCode} className="flex flex-col gap-4" noValidate>
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
        </Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@university.edu" />
        {show("email") && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={step === "sending"}>
        {step === "sending" ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
        {step === "sending" ? "Dispatching secure code..." : "Send secure code"}
      </Button>
      <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
        New accounts are reviewed by the Hub Administrator (KYC) before trading access is granted.
      </p>
    </form>
  )
}

export function LoginGate() {
  const { findAccount } = useAuth()
  const { approvedIds, kycQueue } = useHub()
  const [selected, setSelected] = useState<string | null>(null)
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
              <p className="text-xs text-muted-foreground">Period 4 · Trading open · {TEAM_COUNT} teams</p>
            </div>
          </div>
          <div>
            <h1 id="pick-team" className="text-balance text-2xl font-bold tracking-tight">Select your team</h1>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              Search the roster by team number or company. Demo: <span className="font-mono text-foreground">Team 7</span> or{" "}
              <span className="font-mono text-foreground">Team 18</span>, PIN <span className="font-mono text-foreground">1234</span>.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-picker">Team</Label>
            <TeamCombobox
              id="team-picker"
              value={selected}
              onChange={setSelected}
              renderMeta={(t) =>
                t.equity < 0 ? (
                  <span className="text-[10px] font-semibold uppercase text-destructive">Bankrupt</span>
                ) : approvedIds.includes(t.id) && findAccount(t.id) ? (
                  <span className="text-[10px] font-semibold uppercase text-success">Active</span>
                ) : kycQueue.some((r) => r.teamId === t.id) ? (
                  <span className="text-[10px] font-semibold uppercase text-warning">Pending</span>
                ) : null
              }
            />
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Teams", value: TEAM_COUNT },
              { label: "Verified", value: approvedIds.length },
              { label: "In review", value: kycQueue.length },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-secondary/40 px-2 py-2.5">
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
