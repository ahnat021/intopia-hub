import Image from "next/image"
import { cn } from "@/lib/utils"

/** The Intopia black cat mascot, used as the hub's logo mark. */
export function BrandMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full ring-2 ring-primary/40", className ?? "size-9")}>
      <Image src="/images/intopia-cat.png" alt="Intopia Hub black cat logo" fill sizes="64px" priority={priority} className="object-cover" />
    </span>
  )
}
