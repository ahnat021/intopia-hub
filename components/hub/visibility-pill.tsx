import { Globe, Lock, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const VARIANTS = {
  public: {
    icon: Globe,
    label: "PUBLIC TO ALL 75 TEAMS",
    detail: "Visible across the cohort (Counterparty Team # masked on open listings until negotiation begins).",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  private: {
    icon: Lock,
    label: "PRIVATE TEAM VAULT",
    detail: "Shared strictly between your team and your direct counterparty.",
    className: "border-chart-2/40 bg-chart-2/10 text-chart-2",
  },
  operator: {
    icon: ShieldCheck,
    label: "TEAM 25 OPERATOR EYES ONLY",
    detail: "Restricted exclusively to Clearinghouse Operators.",
    className: "border-gold/50 bg-gold/10 text-gold",
  },
} as const

export function VisibilityPill({ scope, className }: { scope: keyof typeof VARIANTS; className?: string }) {
  const v = VARIANTS[scope]
  const Icon = v.icon
  return (
    <p role="note" className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-xs", v.className, className)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="font-mono font-semibold tracking-wider">{v.label}</span>
      <span className="text-muted-foreground">— {v.detail}</span>
    </p>
  )
}
