import Image from "next/image"
import { TEAM_25_OPERATORS } from "@/lib/constants"
import { HubCrest } from "@/components/brand-mark"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Team25Hero() {
  return (
    <section
      aria-label="Intopia Hub, operated by Team 25"
      className="mx-auto mt-4 w-full max-w-[1440px] px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-amber-500/40 bg-slate-950/80 px-5 py-5 text-slate-100 backdrop-blur-md md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          <HubCrest className="size-12 shrink-0" />
          <div className="flex flex-col gap-1">
            <h2 className="text-balance font-serif text-lg font-bold tracking-wider text-amber-400 sm:text-xl">
              INTOPIA HUB — OPERATED BY TEAM 25
            </h2>
            <p className="text-sm text-slate-400">Independent B2B trading, escrow records and Datalog tools for the ADM 4711 cohort.</p>
          </div>
        </div>
        <ul className="flex flex-wrap items-start justify-center gap-4">
          {TEAM_25_OPERATORS.map((op, i) => (
            <li key={`${op.name}-${i}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={op.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${op.name}, ${op.role}. Connect on LinkedIn`}
                    className="group flex w-20 flex-col items-center gap-1.5 text-center"
                  >
                    <span className="relative size-16 rounded-full ring-2 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.45)] transition-transform group-hover:scale-110">
                      <Image src={op.imageUrl} alt="" fill sizes="64px" className="rounded-full object-cover" />
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold lowercase text-white ring-2 ring-slate-950"
                      >
                        in
                      </span>
                    </span>
                    <span className="line-clamp-1 text-xs font-semibold text-slate-100 group-hover:text-amber-300">{op.name}</span>
                    <span className="line-clamp-2 text-[11px] leading-tight text-slate-400">{op.role}</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>Connect on LinkedIn</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
