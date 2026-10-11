"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"

type SetupStep = "email" | "code"

export function AdminLogin() {
  const { adminConfigured, configured } = useHub()
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Back to the hub
        </Link>
        <section aria-labelledby="admin-login-title" className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <BrandMark className="size-12" />
            <div>
              <h1 id="admin-login-title" className="text-xl font-bold tracking-tight">
                Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                {adminConfigured ? "Facilitator sign-in" : "First-time administrator setup"}
              </p>
            </div>
          </div>
          {!configured ? (
            <p role="status" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm leading-relaxed">
              The database is still being provisioned. Refresh this page in a moment.
            </p>
          ) : adminConfigured ? (
            <SignInForm />
          ) : (
            <SetupForm />
          )}
        </section>
      </div>
    </main>
  )
}

function SignInForm() {
  const { adminSignIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await adminSignIn(email, password)
      if (!result.ok) setError(result.error)
    } catch (error) {
      const message = `Admin sign-in failed: ${error instanceof Error ? error.message : "server error"}`
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-email">Admin email</Label>
        <Input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !email || !password}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
        Sign in
      </Button>
    </form>
  )
}

function SetupForm() {
  const { completeAdminSetup } = useAuth()
  const [step, setStep] = useState<SetupStep>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "admin-setup" }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        const message = body.error ?? `Could not send the code (HTTP ${res.status}).`
        setError(message)
        toast.error(message)
      } else setStep("code")
    } catch (error) {
      const message = `Network error: ${error instanceof Error ? error.message : "request failed"}`
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const finish = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await completeAdminSetup(email, code, password)
      if (!result.ok) setError(result.error)
    } catch (error) {
      const message = `Admin setup failed: ${error instanceof Error ? error.message : "server error"}`
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-4" noValidate>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No administrator exists yet. Enter the facilitator email to receive a 6-digit verification code.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-email">Admin email</Label>
          <Input id="setup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !email.includes("@")}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <MailCheck aria-hidden />}
          Send verification code
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={finish} className="flex flex-col gap-4" noValidate>
      <p className="text-sm leading-relaxed text-muted-foreground">
        We sent a code to <span className="font-medium text-foreground">{email}</span>. It expires in 10 minutes.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="setup-code">Verification code</Label>
        <Input
          id="setup-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="font-mono tracking-[0.4em]"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="setup-password">New password</Label>
        <Input id="setup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="setup-confirm">Confirm password</Label>
        <Input id="setup-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || code.length !== 6 || password.length < 10}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
        Create administrator
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void sendCode()}>
        Resend code
      </Button>
    </form>
  )
}
