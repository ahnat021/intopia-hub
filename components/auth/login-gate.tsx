"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Globe2, KeyRound, Mail, MessageCircle, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

type Step = "team" | "pin" | "setup"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 4)

export function LoginGate() {
  const { findAccount, signIn, register } = useAuth()
  const [step, setStep] = useState<Step>("team")
  const [teamName, setTeamName] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  function reset(next: Step) {
    setPin("")
    setConfirmPin("")
    setError(null)
    setStep(next)
  }

  function handleTeam(e: FormEvent) {
    e.preventDefault()
    const name = teamName.trim()
    if (name.length < 2 || name.length > 40) {
      setError("Team name must be 2–40 characters.")
      return
    }
    setTeamName(name)
    reset(findAccount(name) ? "pin" : "setup")
  }

  function handlePin(e: FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) {
      setError("Enter your 4-digit PIN.")
      return
    }
    if (!signIn(teamName, pin)) {
      setError("Incorrect PIN. Please try again.")
      setPin("")
    }
  }

  function handleSetup(e: FormEvent) {
    e.preventDefault()
    const phoneDigits = whatsapp.replace(/\D/g, "")
    if (pin.length !== 4) return setError("Your PIN must be exactly 4 digits.")
    if (pin !== confirmPin) return setError("PINs don't match.")
    if (phoneDigits.length < 8 || phoneDigits.length > 15 || !/^\+?[\d\s()-]+$/.test(whatsapp.trim()))
      return setError("Enter a valid WhatsApp number with country code.")
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid team email.")
    register({ name: teamName, pin, whatsapp: whatsapp.trim(), email: email.trim().toLowerCase() })
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <Image
        src="/images/globe-network.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover opacity-30 select-none"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

      <main className="relative flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-400 shadow-lg shadow-primary/30 ring-1 ring-white/20">
            <Globe2 className="size-7 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-balance text-3xl font-bold tracking-tight">
              Intopia <span className="text-primary">Hub</span>
            </h1>
            <p className="text-sm text-muted-foreground">Team access · Period 4 trading floor</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          {step === "team" && (
            <form onSubmit={handleTeam} className="flex flex-col gap-5" noValidate>
              <StepHeading icon={Users} title="Sign in to your team" subtitle="Enter your team name to continue." />
              <div className="grid gap-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Nordvik Industries"
                  autoComplete="organization"
                  maxLength={40}
                  autoFocus
                  className="h-11"
                />
              </div>
              <ErrorText error={error} />
              <Button type="submit" size="lg" className="w-full">
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo returning team: <span className="font-mono text-foreground">Helix Dynamics</span> · PIN{" "}
                <span className="font-mono text-foreground">1234</span>
              </p>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePin} className="flex flex-col gap-5" noValidate>
              <BackButton onClick={() => reset("team")} />
              <StepHeading icon={KeyRound} title={`Welcome back, ${teamName}`} subtitle="Enter your 4-digit team PIN." />
              <PinField id="pin" label="Team PIN" value={pin} onChange={setPin} autoComplete="current-password" autoFocus />
              <ErrorText error={error} />
              <Button type="submit" size="lg" className="w-full" disabled={pin.length !== 4}>
                Enter the Hub
              </Button>
            </form>
          )}

          {step === "setup" && (
            <form onSubmit={handleSetup} className="flex flex-col gap-5" noValidate>
              <BackButton onClick={() => reset("team")} />
              <StepHeading
                icon={ShieldCheck}
                title={`Register ${teamName}`}
                subtitle="First time here — set a PIN and the contacts other teams use to negotiate with you."
              />
              <div className="grid grid-cols-2 gap-3">
                <PinField id="new-pin" label="Set up a 4-digit PIN" value={pin} onChange={setPin} autoComplete="new-password" autoFocus />
                <PinField id="confirm-pin" label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} autoComplete="new-password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
                  <MessageCircle className="size-3.5 text-emerald-400" aria-hidden />
                  WhatsApp number
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+1 415 555 0100"
                  autoComplete="tel"
                  maxLength={22}
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-email" className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" aria-hidden />
                  Team email
                </Label>
                <Input
                  id="team-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trade@yourteam.com"
                  autoComplete="email"
                  maxLength={80}
                  className="h-11"
                />
              </div>
              <ErrorText error={error} />
              <Button type="submit" size="lg" className="w-full">
                Create team & enter
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">Simulated access for training purposes only.</p>
      </main>
    </div>
  )
}

function StepHeading({ icon: Icon, title, subtitle }: { icon: typeof Users; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-primary" aria-hidden />
        <span className="text-balance">{title}</span>
      </h2>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function PinField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  autoFocus?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(digitsOnly(e.target.value))}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder="••••"
        className={cn("h-11 text-center font-mono text-xl tracking-[0.5em]")}
      />
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Different team
    </button>
  )
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  )
}
