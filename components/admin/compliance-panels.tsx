"use client"

import { useState, type FormEvent } from "react"
import { Check, Gavel, MailCheck, UserCheck, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamCombobox } from "@/components/team-combobox"
import { useHub } from "@/lib/hub-store"
import { FINE_REASONS, formatSimClock, teamLabel, type FineReason } from "@/lib/mock-data"
import { formatCompactUSD } from "@/lib/intopia-rules"

export function KycQueuePanel() {
  const { kycQueue, approveKyc, rejectKyc } = useHub()

  return (
    <section aria-labelledby="kyc-title" className="flex min-w-0 flex-col rounded-xl border border-border bg-card/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="kyc-title" className="flex items-center gap-2 font-semibold">
          <UserCheck className="size-4 text-primary" aria-hidden />
          KYC Approvals
        </h2>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs">{kycQueue.length} pending</span>
      </div>
      {kycQueue.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No teams awaiting verification.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {kycQueue.map((r) => (
            <li key={r.teamId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <MailCheck className="size-4 shrink-0 text-success" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{teamLabel(r.teamId)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.email} · email verified · {formatSimClock(r.at)}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={() => {
                    approveKyc(r.teamId)
                    toast.success(`${teamLabel(r.teamId)} approved`, { description: "The team can now enter the hub." })
                  }}
                >
                  <Check aria-hidden />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    rejectKyc(r.teamId)
                    toast(`${teamLabel(r.teamId)} rejected`)
                  }}
                  aria-label={`Reject ${teamLabel(r.teamId)}`}
                >
                  <X aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function FinesPanel() {
  const { fines, issueFine, platformFeesUSD } = useHub()
  const [teamId, setTeamId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState<FineReason>(FINE_REASONS[0])
  const amountK = Number(amount)
  const valid = !!teamId && Number.isFinite(amountK) && amountK > 0 && amountK <= 100_000

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || !teamId) return
    issueFine(teamId, Math.round(amountK), reason)
    toast.success("Fine issued", { description: `${teamLabel(teamId)} · ${formatCompactUSD(amountK * 1000)} · broadcast to the activity feed` })
    setAmount("")
    setTeamId(null)
  }

  return (
    <section aria-labelledby="fines-title" className="flex min-w-0 flex-col rounded-xl border border-border bg-card/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="fines-title" className="flex items-center gap-2 font-semibold">
          <Gavel className="size-4 text-destructive" aria-hidden />
          Regulatory Fines
        </h2>
        <span className="text-xs text-muted-foreground">
          AI fees collected: <span className="font-mono text-foreground">{formatCompactUSD(platformFeesUSD)}</span>
        </span>
      </div>
      <form onSubmit={submit} className="grid gap-3 border-b border-border p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="fine-team">Team</Label>
          <TeamCombobox id="fine-team" value={teamId} onChange={setTeamId} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fine-amount">Amount ($K)</Label>
          <Input id="fine-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="250" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fine-reason">Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as FineReason)}>
            <SelectTrigger id="fine-reason" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINE_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="destructive" disabled={!valid} className="sm:col-span-2">
          <Gavel aria-hidden />
          Issue fine &amp; broadcast
        </Button>
      </form>
      <ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto">
        {fines.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No fines issued this simulation.</li>}
        {fines.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{teamLabel(f.teamId)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {f.reason} · {formatSimClock(f.at)}
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-destructive">-{formatCompactUSD(f.amountK * 1000)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
