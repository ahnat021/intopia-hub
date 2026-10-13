"use client"

import { useState } from "react"
import { BadgePercent, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { redeemPromo } from "@/lib/actions/clearinghouse-actions"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { formatUSD } from "@/lib/intopia-rules"
import { cn } from "@/lib/utils"
import {
  CLEARING_FEE_RATE,
  PROMO_ACTIVE_NOTE,
  PROMO_CODE,
  PROMO_EXPIRED_NOTE,
  clearingFee,
  promoActive,
  promoWindowOpen,
} from "@/lib/constants"

/** The viewer's effective promo code, including one redeemed during this session. */
export function useViewerPromo() {
  const { team } = useAuth()
  const hub = useHub()
  const [redeemed, setRedeemed] = useState<string | null>(null)
  const stored = team ? (hub.teamById[team.id]?.promo_code_used ?? team.promo_code_used ?? null) : null
  return { code: redeemed ?? stored, setRedeemed, refresh: hub.refresh }
}

/** Lets a team that skipped onboarding redeem INTOPIATRIAL later. */
export function PromoRedeem({ onRedeemed, compact }: { onRedeemed?: (code: string) => void; compact?: boolean }) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  if (!promoWindowOpen()) return null

  const apply = async () => {
    setBusy(true)
    const res = await redeemPromo(code)
    setBusy(false)
    if (!res.ok) return toast.error(res.error)
    toast.success("INTOPIATRIAL waiver activated.")
    setCode("")
    onRedeemed?.(PROMO_CODE)
  }

  return (
    <div className={cn("flex gap-2", compact ? "items-center" : "flex-col sm:flex-row sm:items-center")}>
      <label htmlFor="promo-redeem" className="sr-only">Promo code</label>
      <Input
        id="promo-redeem"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
          e.preventDefault()
          if (code.trim()) void apply()
        }}
        placeholder="Enter INTOPIATRIAL"
        className="h-8 font-mono text-xs uppercase"
      />
      <Button type="button" size="sm" variant="outline" disabled={busy || !code.trim()} onClick={apply}>
        <BadgePercent aria-hidden />
        Apply
      </Button>
    </div>
  )
}

/** Fee box for contract creation, negotiation and marketplace views. */
export function FeeSummary({ contractValue, editable = true, className }: { contractValue?: number; editable?: boolean; className?: string }) {
  const { code, setRedeemed, refresh } = useViewerPromo()
  const waived = promoActive(code)
  const windowOpen = promoWindowOpen()
  const standardFee = Math.round(CLEARING_FEE_RATE * (contractValue ?? 0) * 100) / 100
  const fee = clearingFee(contractValue ?? 0, code)
  const hasValue = contractValue != null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 text-xs leading-relaxed",
        waived ? "border-success/40 bg-success/10" : "border-gold/40 bg-gold/10",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          Clearing & Protection Fee
        </p>
        <p className="font-mono tabular-nums text-foreground">
          {waived ? (
            <>
              <s className="text-muted-foreground">0.75%{hasValue ? ` (${formatUSD(standardFee)})` : ""}</s>
              {" → "}
              <strong>0.00% ($0)</strong>
            </>
          ) : (
            <strong>0.75%{hasValue ? ` = ${formatUSD(fee)}` : ""}</strong>
          )}
        </p>
      </div>
      <p className="text-pretty text-muted-foreground">
        {waived ? PROMO_ACTIVE_NOTE : windowOpen ? "Standard 0.375% Buyer / 0.375% Seller split. Have the trial code? Apply it below to waive the fee until Oct 21 @ 22:00 EDT." : PROMO_EXPIRED_NOTE}
      </p>
      {editable && !waived && windowOpen && (
        <PromoRedeem
          compact
          onRedeemed={(c) => {
            setRedeemed(c)
            void refresh()
          }}
        />
      )}
    </div>
  )
}
