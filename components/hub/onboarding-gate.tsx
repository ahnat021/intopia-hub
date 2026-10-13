"use client"

import { useState } from "react"
import { Crown, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { redeemPromo, saveTeamProfile } from "@/lib/actions/clearinghouse-actions"
import { CLEARING_FEE_LABEL, PROMO_RULE } from "@/lib/constants"
import type { Team } from "@/lib/domain"

type Step = "waiver" | "promo" | "roster"
type Member = { name: string; isLeader: boolean }

interface Props {
  team: Team
  open: boolean
  /** Edit mode skips the waiver and promo steps. */
  mode?: "onboard" | "edit"
  signed: boolean
  onSign: (name: string) => Promise<boolean>
  onDone: () => void
  onOpenChange?: (open: boolean) => void
}

const RULES = [
  "If a contract is not respected, the Administrator may impose a monetary penalty based on the terms of the contract.",
  "In the absence of a contract provision for penalties, a discretionary penalty may be attributed.",
  "I have read the game rules: penalties, contracts, the 0.75% Escrow Protection Fee, and fair-play conduct.",
  "If the website has a bug or crash it will be fixed as soon as possible, but Team 25 and the hub administrators are not responsible for resulting losses.",
]

export function OnboardingGate({ team, open, mode = "onboard", signed, onSign, onDone, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>(mode === "edit" ? "roster" : signed ? "promo" : "waiver")
  const [checks, setChecks] = useState(RULES.map(() => false))
  const [signatory, setSignatory] = useState("")
  const [promo, setPromo] = useState("")
  const [members, setMembers] = useState<Member[]>(team.team_members?.length ? team.team_members : [{ name: "", isLeader: true }])
  const [whatsapp, setWhatsapp] = useState(team.whatsapp ?? "")
  const [contactEmail, setContactEmail] = useState(team.contact_email ?? "")
  const [busy, setBusy] = useState(false)

  const sign = async () => {
    setBusy(true)
    const ok = await onSign(signatory)
    setBusy(false)
    if (ok) setStep("promo")
  }

  const applyPromo = async () => {
    setBusy(true)
    const res = await redeemPromo(promo)
    setBusy(false)
    if (!res.ok) return toast.error(res.error)
    toast.success("100% Trial Fee Waiver activated.")
    setStep("roster")
  }

  const saveRoster = async () => {
    setBusy(true)
    const res = await saveTeamProfile({ members, whatsapp, contactEmail })
    setBusy(false)
    if (!res.ok) return toast.error(res.error)
    toast.success("Team profile saved.")
    onDone()
  }

  const update = (i: number, patch: Partial<Member>) =>
    setMembers((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : patch.isLeader ? { ...x, isLeader: false } : x)))

  const stepIndex = { waiver: 1, promo: 2, roster: 3 }[step]

  return (
    <Dialog open={open} onOpenChange={mode === "edit" ? onOpenChange : undefined}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" showCloseButton={mode === "edit"} onInteractOutside={(e) => mode !== "edit" && e.preventDefault()}>
        <DialogHeader>
          {mode === "onboard" && <p className="font-mono text-xs tracking-widest text-gold">STEP {stepIndex} OF 3</p>}
          <DialogTitle className="font-serif text-xl">
            {step === "waiver" ? "Fair-Play & Hub Waiver" : step === "promo" ? "Trial Phase Promo Code" : mode === "edit" ? "Edit Team Profile" : "Team Roster & Contact Logbook"}
          </DialogTitle>
          <DialogDescription>
            {step === "waiver"
              ? `${team.name} must accept the hub rules before trading.`
              : step === "promo"
                ? `Every executed trade carries a small ${CLEARING_FEE_LABEL}.`
                : "Add 1 to 8 members and choose exactly one Team Leader. This appears in the public Cohort Logbook."}
          </DialogDescription>
        </DialogHeader>

        {step === "waiver" && (
          <div className="flex flex-col gap-3">
            {RULES.map((rule, i) => (
              <label key={rule} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm leading-relaxed">
                <Checkbox checked={checks[i]} onCheckedChange={(v) => setChecks((c) => c.map((x, j) => (j === i ? v === true : x)))} className="mt-0.5" />
                {rule}
              </label>
            ))}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="og-sign">Full name of signing representative</Label>
              <Input id="og-sign" value={signatory} onChange={(e) => setSignatory(e.target.value)} autoComplete="name" />
            </div>
          </div>
        )}

        {step === "promo" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="og-promo">Promo code (optional)</Label>
              <Input id="og-promo" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="INTOPIATRIAL" className="font-mono uppercase" />
            </div>
            <p className="rounded-md border border-gold/40 bg-gold/10 p-3 text-sm leading-relaxed text-foreground">{PROMO_RULE}</p>
          </div>
        )}

        {step === "roster" && (
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Team members ({members.length}/8) — select the leader</legend>
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant={m.isLeader ? "default" : "outline"}
                    aria-label={m.isLeader ? `${m.name || "Member"} is Team Leader` : `Make ${m.name || "member"} Team Leader`}
                    aria-pressed={m.isLeader}
                    onClick={() => update(i, { isLeader: true })}
                    className={m.isLeader ? "bg-gold text-gold-foreground hover:bg-gold/90" : ""}
                  >
                    <Crown aria-hidden />
                  </Button>
                  <Input aria-label={`Member ${i + 1} name`} value={m.name} onChange={(e) => update(i, { name: e.target.value })} placeholder={`Member ${i + 1}`} />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove member ${i + 1}`}
                    disabled={members.length <= 1}
                    onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="self-start" disabled={members.length >= 8} onClick={() => setMembers((m) => [...m, { name: "", isLeader: false }])}>
                <Plus aria-hidden /> Add Member
              </Button>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="og-wa">Main contact WhatsApp</Label>
                <Input id="og-wa" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1 613 555 0100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="og-email">Secondary email (optional)</Label>
                <Input id="og-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "waiver" && (
            <Button onClick={sign} disabled={busy || !checks.every(Boolean) || signatory.trim().length < 2}>
              Sign & Accept Intopia Hub Rules & Waiver
            </Button>
          )}
          {step === "promo" && (
            <>
              <Button variant="ghost" onClick={() => setStep("roster")}>
                Skip
              </Button>
              <Button onClick={applyPromo} disabled={busy || !promo.trim()}>
                Apply code
              </Button>
            </>
          )}
          {step === "roster" && (
            <Button onClick={saveRoster} disabled={busy}>
              Save team profile
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
