import { BrandMark } from "@/components/brand-mark"
import { PeriodStatus } from "./period-status"

export function HubHeader() {
  return (
    <header className="border-b border-border bg-secondary/40">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-7">
        <div className="flex items-center gap-4">
          <BrandMark className="size-14" priority />
          <div>
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Intopia <span className="text-gold">Hub</span>
            </h1>
            <p className="text-sm text-muted-foreground">Global economy simulation · North America · Europe · China</p>
          </div>
        </div>
        <PeriodStatus />
      </div>
    </header>
  )
}
