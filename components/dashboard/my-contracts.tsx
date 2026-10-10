"use client"

import { FileSignature, Lock, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCompactUSD } from "@/lib/intopia-rules"
import { teamLabel, type Contract } from "@/lib/mock-data"

const KIND: Record<Contract["kind"], string> = { PRODUCT_SALE: "Sale", PATENT_LICENSE: "License", B2B_LOAN: "Loan" }

export function MyContracts({ contracts, viewerId, onOpen }: { contracts: Contract[]; viewerId: string; onOpen: (c: Contract) => void }) {
  const mine = contracts
    .filter((c) => c.initiatorId === viewerId || c.counterpartyId === viewerId)
    .sort((a, b) => Number(a.status === "FINALIZED") - Number(b.status === "FINALIZED") || b.createdAt - a.createdAt)
  const toSign = mine.filter((c) => c.status === "AWAITING" && c.counterpartyId === viewerId).length

  return (
    <section aria-labelledby="my-contracts" className={cn("rounded-xl border bg-card", toSign ? "border-amber-500/40" : "border-border")}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="my-contracts" className="flex items-center gap-2 text-sm font-semibold">
          <FileSignature className="size-4 text-primary" aria-hidden />
          My Contracts
        </h2>
        {toSign > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">{toSign} to sign</span>}
      </div>
      {mine.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No contracts yet. Open a listing to negotiate.</p>
      ) : (
        <ul className="divide-y divide-border">
          {mine.map((c) => {
            const other = c.initiatorId === viewerId ? c.counterpartyId : c.initiatorId
            const needsSig = c.status === "AWAITING" && c.counterpartyId === viewerId
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{KIND[c.kind]} · {teamLabel(other)}</p>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    {c.status === "FINALIZED" && <Lock className="size-3 text-emerald-400" aria-hidden />}
                    {c.id} · {formatCompactUSD(c.totalValue)} · {c.status === "FINALIZED" ? "Finalized" : needsSig ? "Your signature" : "Awaiting them"}
                  </p>
                </div>
                <Button size="xs" variant={needsSig ? "default" : "ghost"} onClick={() => onOpen(c)}>
                  {needsSig && <PenLine aria-hidden />}
                  {needsSig ? "Review & Sign" : "Open"}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
