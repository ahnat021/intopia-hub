import { ArrowDownLeft, ArrowUpRight, FlaskConical, Handshake, Plane, Ship, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeliveryMode, ListingStatus, ListingType } from "@/lib/mock-data"

const SHORT_TYPE_LABEL: Record<ListingType, string> = {
  BUY: "Buy",
  SELL: "Sell",
  PARTNERSHIP: "JV",
  RND: "License",
}

const STATUS_LABEL: Record<ListingStatus, string> = {
  OPEN: "OPEN",
  NEGOTIATING: "NEGOTIATING",
  PENDING_SIGNATURE: "PENDING SIGNATURE",
  CLOSED: "CLOSED",
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  OPEN: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  NEGOTIATING: "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  PENDING_SIGNATURE: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  CLOSED: "bg-slate-500/15 text-slate-400 ring-slate-500/25",
}

const STATUS_DOT: Record<ListingStatus, string> = {
  OPEN: "bg-emerald-400",
  NEGOTIATING: "bg-sky-400",
  PENDING_SIGNATURE: "bg-amber-400 animate-pulse",
  CLOSED: "bg-slate-400",
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export const TYPE_META: Record<ListingType, { icon: LucideIcon; className: string }> = {
  BUY: { icon: ArrowDownLeft, className: "text-sky-400 bg-sky-500/15" },
  SELL: { icon: ArrowUpRight, className: "text-emerald-400 bg-emerald-500/15" },
  PARTNERSHIP: { icon: Handshake, className: "text-violet-400 bg-violet-500/15" },
  RND: { icon: FlaskConical, className: "text-amber-400 bg-amber-500/15" },
}

export function TypeIcon({ type, className }: { type: ListingType; className?: string }) {
  const { icon: Icon, className: tone } = TYPE_META[type]
  return (
    <span aria-hidden className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md", tone, className)}>
      <Icon className="size-3.5" />
    </span>
  )
}

export function TypeLabel({ type }: { type: ListingType }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <TypeIcon type={type} />
      {SHORT_TYPE_LABEL[type]}
    </span>
  )
}

export function DeliveryLabel({ mode }: { mode: DeliveryMode | null }) {
  if (!mode) return <span className="text-muted-foreground">—</span>
  const Icon = mode === "AIR" ? Plane : Ship
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", mode === "AIR" ? "text-sky-300" : "text-teal-300")}>
      <Icon className="size-3.5" aria-hidden />
      {mode === "AIR" ? "Air" : "Surface"}
    </span>
  )
}
