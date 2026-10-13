import { Handshake } from "lucide-react"
import { cn } from "@/lib/utils"

/** Intopia Hub logo mark. */
export function BrandMark({ className }: { className?: string; priority?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Intopia Hub logo"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground", className ?? "size-9")}
    >
      <Handshake className="size-1/2" aria-hidden />
    </span>
  )
}
