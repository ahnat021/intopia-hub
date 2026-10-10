"use client"

import { useState } from "react"
import confetti from "canvas-confetti"
import { CheckCircle2, Clock, FileSignature, Lock, PenLine, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { DELIVERY_INFO, PRODUCT_INFO, formatUSD, formatUnits, productCode } from "@/lib/intopia-rules"
import { formatSimClock, teamLabel, type Contract } from "@/lib/mock-data"

const KIND_LABEL: Record<Contract["kind"], string> = {
  PRODUCT_SALE: "Product Sale",
  PATENT_LICENSE: "Patent License",
  B2B_LOAN: "B2B Loan",
}
const ROLES: Record<Contract["kind"], [string, string]> = {
  PRODUCT_SALE: ["Seller", "Buyer"],
  PATENT_LICENSE: ["Licensor", "Licensee"],
  B2B_LOAN: ["Lender", "Borrower"],
}

function termRows(c: Contract): [string, string][] {
  const rows: [string, string][] = []
  if (c.kind !== "B2B_LOAN") rows.push(["Product", `${PRODUCT_INFO[c.product].name} · ${productCode(c.product, c.grade)}`])
  if (c.kind === "PRODUCT_SALE") {
    rows.push(["Quantity", `${formatUnits(c.quantity)} units`], ["Unit price", formatUSD(c.unitPrice)])
    if (c.delivery) rows.push(["Delivery", `${DELIVERY_INFO[c.delivery].label} → ${c.region}`], ["Arrival", DELIVERY_INFO[c.delivery].eta])
  }
  if (c.kind === "B2B_LOAN") rows.push(["Interest", `${c.interestRate}% per period`])
  rows.push(["Payment", `${c.cashPct}% cash · ${c.ar1Pct}% A/R1 · ${c.ar2Pct}% A/R2`])
  return rows
}

function Signature({ teamId, signed, at }: { teamId: string; signed: boolean; at?: number }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className={cn("flex h-9 items-end border-b border-dashed pb-1", signed ? "border-emerald-400/60" : "border-border")}>
        {signed ? (
          <span className="font-serif text-lg italic text-emerald-300">{teamLabel(teamId)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Awaiting signature</span>
        )}
      </div>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {signed ? <CheckCircle2 className="size-3 text-emerald-400" aria-hidden /> : <Clock className="size-3" aria-hidden />}
        {teamLabel(teamId)}{signed && at ? ` · ${formatSimClock(at)}` : ""}
      </p>
    </div>
  )
}

function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const colors = ["#3b82f6", "#34d399", "#fbbf24"]
  confetti({ particleCount: 120, spread: 80, origin: { x: 0.75, y: 0.6 }, colors })
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { x: 0.6, y: 0.5 }, colors }), 220)
}

export function ContractCard({
  contract,
  viewerId,
  locked,
  onFinalize,
}: {
  contract: Contract
  viewerId: string
  locked: boolean
  onFinalize: (contractId: string) => Contract | null
}) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const finalized = contract.status === "FINALIZED"
  const canSign = !finalized && contract.counterpartyId === viewerId
  const receiverId = contract.providerId === contract.initiatorId ? contract.counterpartyId : contract.initiatorId
  const [providerRole, receiverRole] = ROLES[contract.kind]

  const confirm = () => {
    const result = onFinalize(contract.id)
    setReviewOpen(false)
    if (result) {
      celebrate()
      toast.success("Trade finalized & locked", { description: `${contract.id} · ${formatUSD(contract.totalValue)}` })
    } else {
      toast.error("Unable to finalize", { description: "Contracts are locked for Period 4 processing." })
    }
  }

  return (
    <article
      aria-label={`Contract ${contract.id}`}
      className={cn(
        "overflow-hidden rounded-xl border bg-gradient-to-b from-secondary/80 to-card",
        finalized ? "border-emerald-500/40" : "border-amber-500/40",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
          <FileSignature className="size-3.5 text-primary" aria-hidden />
          {KIND_LABEL[contract.kind]} Contract
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">{contract.id}</span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset",
            finalized ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "bg-amber-500/15 text-amber-300 ring-amber-500/30",
          )}
        >
          {finalized ? <Lock className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
          {finalized ? "Officially Finalized & Locked" : "Awaiting Counterparty Signature"}
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-background/40 p-2">
            <p className="text-muted-foreground">{providerRole}</p>
            <p className="font-semibold">{teamLabel(contract.providerId)}</p>
          </div>
          <div className="rounded-lg bg-background/40 p-2">
            <p className="text-muted-foreground">{receiverRole}</p>
            <p className="font-semibold">{teamLabel(receiverId)}</p>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {termRows(contract).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Total value</span>
          <span className="font-mono text-base font-bold tabular-nums">{formatUSD(contract.totalValue)}</span>
        </div>

        <div className="flex gap-4">
          <Signature teamId={contract.initiatorId} signed at={contract.createdAt} />
          <Signature teamId={contract.counterpartyId} signed={finalized} at={contract.finalizedAt} />
        </div>

        {canSign && (
          <Button onClick={() => setReviewOpen(true)} disabled={locked} className="w-full">
            <PenLine aria-hidden />
            {locked ? "Signing locked (8:30 PM)" : "Review & Sign Contract"}
          </Button>
        )}
        {!finalized && contract.initiatorId === viewerId && (
          <p className="text-pretty text-xs text-muted-foreground">
            Sent to {teamLabel(contract.counterpartyId)}. Switch Team to sign as the counterparty.
          </p>
        )}
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden />
              Review contract {contract.id}
            </DialogTitle>
            <DialogDescription>
              Signing is binding. Both teams are committed to these terms for Period 4 processing.
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-secondary/60 p-3 text-sm">
            <dt className="text-muted-foreground">{providerRole}</dt>
            <dd className="text-right font-medium">{teamLabel(contract.providerId)}</dd>
            <dt className="text-muted-foreground">{receiverRole}</dt>
            <dd className="text-right font-medium">{teamLabel(receiverId)}</dd>
            {termRows(contract).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
            <dt className="font-semibold">Total</dt>
            <dd className="text-right font-mono font-bold">{formatUSD(contract.totalValue)}</dd>
          </dl>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={confirm} disabled={locked}>
              <CheckCircle2 aria-hidden />
              Confirm & Finalize Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}
