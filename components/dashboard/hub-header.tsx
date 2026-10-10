import Image from "next/image"
import { Globe2 } from "lucide-react"
import { PeriodStatus } from "./period-status"

export function HubHeader({ lockedOut, onToggleLockout }: { lockedOut: boolean; onToggleLockout: () => void }) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-[#0b1324]">
      <Image
        src="/images/globe-network.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-right opacity-40 select-none"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b1324] via-[#0b1324]/85 to-[#0b1324]/30"
      />

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-7">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-400 shadow-lg shadow-primary/30 ring-1 ring-white/20">
            <Globe2 className="size-6 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Intopia <span className="text-primary">Hub</span>
            </h1>
            <p className="text-sm text-muted-foreground">Global economy simulation · North America · Europe · China</p>
          </div>
        </div>

        <PeriodStatus lockedOut={lockedOut} onToggleLockout={onToggleLockout} />
      </div>
    </header>
  )
}
