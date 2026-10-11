"use client"

import { useId, useState } from "react"
import { FileSignature, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CLAUSES = [
  {
    id: "rules",
    title: "Rules of the game",
    text: "We have read and understood the Intopia Hub rules: how listings, negotiations, contracts, deliveries, ratings and the period calendar work.",
  },
  {
    id: "contracts",
    title: "Binding contracts",
    text: "Every contract we sign on the hub is binding on our team. We will deliver, pay and perform exactly as agreed, on time.",
  },
  {
    id: "penalties",
    title: "Penalties for non-compliance",
    text: "If a contract is not respected, the Administrator may impose a monetary penalty based on the terms of the contract or, in the absence of a contractual penalty provision, a discretionary one. Professor Tim may also issue administrative penalties.",
  },
  {
    id: "liability",
    title: "Platform availability",
    text: "The website may occasionally have a bug or crash. The organizers will fix it as soon as possible, but they are not responsible for any loss, missed deal or outcome caused by a bug, crash or downtime.",
  },
] as const

interface Props {
  teamName: string
  open: boolean
  onSign: (signatoryName: string) => Promise<boolean>
}

export function RulesWaiver({ teamName, open, onSign }: Props) {
  const nameId = useId()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const ready = CLAUSES.every((c) => checked[c.id]) && name.trim().length >= 2

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    await onSign(name.trim())
    setBusy(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-h-[92dvh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileSignature className="size-5" aria-hidden />
          </div>
          <DialogTitle className="text-balance">Rules &amp; liability waiver</DialogTitle>
          <DialogDescription className="text-pretty">
            Before {teamName} can trade, a team representative must confirm each statement below and sign.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {CLAUSES.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3 transition-colors has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5">
                  <Checkbox
                    checked={!!checked[c.id]}
                    onCheckedChange={(v) => setChecked((s) => ({ ...s, [c.id]: v === true }))}
                    className="mt-0.5"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{c.title}</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{c.text}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId}>Signature: full name of team representative</Label>
            <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Tremblay" autoComplete="name" maxLength={80} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!ready || busy} className="w-full sm:w-auto">
              <ShieldCheck aria-hidden />
              {busy ? "Signing…" : "I agree & sign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
