import { cn } from "@/lib/utils"

/** Global Clearinghouse Crest: interlocking hexagon + diamond in emerald and champagne gold. */
export function ClearinghouseCrest({ className, animated }: { className?: string; animated?: boolean }) {
  const draw = animated ? "crest-draw" : undefined
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} role="img" aria-label="Intopia Hub Clearinghouse crest">
      <defs>
        <filter id="crest-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#crest-glow)" strokeLinejoin="round" strokeLinecap="round">
        <path className={draw} d="M32 4 56 18v28L32 60 8 46V18Z" stroke="#10B981" strokeWidth="2.4" pathLength={1} />
        <path className={draw} d="M32 14 48 32 32 50 16 32Z" stroke="#F59E0B" strokeWidth="2.4" pathLength={1} />
        <path className={draw} d="M8 18 32 32 56 18M32 32v28" stroke="#10B981" strokeOpacity=".55" strokeWidth="1.4" pathLength={1} />
        <path className={draw} d="M16 32h32M32 14v36" stroke="#F59E0B" strokeOpacity=".5" strokeWidth="1.2" pathLength={1} />
        <circle cx="32" cy="32" r="3.2" fill="#F59E0B" />
      </g>
    </svg>
  )
}

export function BrandMark({ className }: { className?: string; priority?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 p-1 ring-1 ring-amber-500/40",
        className ?? "size-9",
      )}
    >
      <ClearinghouseCrest className="size-full" />
    </span>
  )
}
