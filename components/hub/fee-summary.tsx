import { HeartHandshake } from "lucide-react"
import { formatUSD } from "@/lib/intopia-rules"
import { cn } from "@/lib/utils"
import { PLATFORM_CONTRIBUTION_REMINDER, suggestedContribution } from "@/lib/constants"

/** Voluntary-contribution reminder for contract creation, negotiation and marketplace views. Nothing is charged. */
export function FeeSummary({ contractValue, className }: { contractValue?: number; editable?: boolean; className?: string }) {
  const hasValue = contractValue != null && contractValue > 0
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <HeartHandshake className="size-3.5" aria-hidden />
          Platform contribution
        </p>
        <p className="font-mono tabular-nums text-foreground">
          <strong>0.75%{hasValue ? ` ≈ ${formatUSD(suggestedContribution(contractValue))}` : ""}</strong>
          <span className="text-muted-foreground"> · voluntary</span>
        </p>
      </div>
      <p className="text-pretty text-muted-foreground">{PLATFORM_CONTRIBUTION_REMINDER}</p>
    </div>
  )
}
