"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useHub } from "@/lib/hub-store"
import { PRICE_BOUNDS, averageCost, formatUSD } from "@/lib/intopia-rules"
import type { AiReview, Contract } from "@/lib/mock-data"

export const PLATFORM_FEE_RATE = 0.01

/** Deterministic heuristic "AI" analysis grounded in the Intopia rulebook. */
export function analyzeContract(c: Contract): AiReview {
  let score = 82
  const warnings: string[] = []
  const strengths: string[] = []

  if (c.kind !== "B2B_LOAN") {
    const cost = averageCost(c.product, c.grade)
    const { min, max } = PRICE_BOUNDS[c.product]
    const margin = (c.unitPrice - cost) / cost
    if (c.kind === "PRODUCT_SALE") {
      if (margin < 0) {
        score -= 22
        warnings.push(`Unit price ${formatUSD(c.unitPrice)} is below the ${c.product}${c.grade} average cost (${formatUSD(cost)}). Seller books a loss.`)
      } else if (margin > 0.9) {
        score -= 16
        warnings.push(`Markup of ${Math.round(margin * 100)}% over average cost is aggressive — buyer may be overpaying.`)
      } else {
        score += 6
        strengths.push(`Price sits at a ${Math.round(margin * 100)}% markup over average cost — within a fair band.`)
      }
      if (c.unitPrice <= min * 1.05 || c.unitPrice >= max * 0.95) {
        score -= 6
        warnings.push(`Price is near the rulebook bound (${formatUSD(min)}–${formatUSD(max)}) and may draw admin scrutiny.`)
      }
      if (c.delivery === "SURFACE") warnings.push("Surface freight arrives next period (P5) — inventory will not be sellable this period.")
      if (c.delivery === "AIR") strengths.push("Airfreight lands in the current period (P4).")
      if (c.quantity > 800) {
        score -= 5
        warnings.push("Large volume concentrates counterparty risk on a single delivery.")
      }
    }
  } else {
    if (c.interestRate > 8) {
      score -= 14
      warnings.push(`${c.interestRate}% per period is well above typical intercompany rates.`)
    } else if (c.interestRate < 1) {
      score -= 6
      warnings.push("Near-zero interest may be flagged as a transfer-pricing concern.")
    } else strengths.push(`Interest of ${c.interestRate}% per period is within a normal range.`)
    warnings.push("Confirm the loan does not exceed 25% of the lender's total equity.")
  }

  if (c.ar2Pct >= 50) {
    score -= 12
    warnings.push(`${c.ar2Pct}% deferred to A/R2 — payment risk extends two periods out.`)
  } else if (c.cashPct >= 70) {
    score += 5
    strengths.push(`${c.cashPct}% paid in cash reduces receivable risk.`)
  }

  if (warnings.length === 0) warnings.push("No material risks detected.")
  return {
    score: Math.max(8, Math.min(99, Math.round(score))),
    feeUSD: Math.round(c.totalValue * PLATFORM_FEE_RATE),
    warnings,
    strengths,
  }
}

function scoreTone(score: number) {
  if (score >= 75) return { label: "Fair", className: "text-success", bar: "bg-success" }
  if (score >= 50) return { label: "Caution", className: "text-warning", bar: "bg-warning" }
  return { label: "High risk", className: "text-destructive", bar: "bg-destructive" }
}

export function AiReviewer({ contract }: { contract: Contract }) {
  const { aiReviews, recordAiReview } = useHub()
  const review = aiReviews[contract.id]
  const [running, setRunning] = useState(false)
  const fee = Math.round(contract.totalValue * PLATFORM_FEE_RATE)

  const run = () => {
    setRunning(true)
    window.setTimeout(() => {
      const result = analyzeContract(contract)
      recordAiReview(contract.id, result)
      setRunning(false)
      toast.success(`Fairness Score ${result.score}/100`, { description: `${formatUSD(result.feeUSD)} Platform Infrastructure Fee deducted.` })
    }, 1600)
  }

  if (!review) {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
        <Button variant="secondary" size="sm" onClick={run} disabled={running}>
          {running ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {running ? "Analyzing clauses..." : "AI Contract Review"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Deducts a 1% Platform Infrastructure Fee ({formatUSD(fee)})
        </p>
      </div>
    )
  }

  const tone = scoreTone(review.score)
  return (
    <section aria-label="AI contract review" className="flex flex-col gap-2.5 rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="size-3.5 text-primary" aria-hidden />
          AI Review
        </p>
        <p className={cn("font-mono text-sm font-bold", tone.className)}>
          {review.score}<span className="text-muted-foreground">/100</span> · {tone.label}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuenow={review.score} aria-valuemin={0} aria-valuemax={100} aria-label="Fairness score">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${review.score}%` }} />
      </div>
      <ul className="flex flex-col gap-1.5 text-xs leading-relaxed">
        {review.warnings.map((w) => (
          <li key={w} className="flex gap-1.5">
            <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" aria-hidden />
            <span>{w}</span>
          </li>
        ))}
        {review.strengths.map((s) => (
          <li key={s} className="flex gap-1.5 text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" aria-hidden />
            <span>{s}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-border pt-2 text-[11px] text-muted-foreground">
        Platform Infrastructure Fee charged: <span className="font-mono text-foreground">{formatUSD(review.feeUSD)}</span> (1%)
      </p>
    </section>
  )
}
