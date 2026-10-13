import Image from "next/image"
import { TEAM_25_MEMBERS } from "@/lib/constants"
import { BrandMark } from "@/components/brand-mark"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Team25Hero() {
  return (
    <section aria-label="Intopia Hub, operated by Team 25" className="mx-auto mt-4 w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card px-5 py-4 text-card-foreground md:flex-row md:justify-between">
        <div className="flex items-center gap-3">
          <BrandMark className="size-11" />
          <div className="flex flex-col gap-0.5">
            <h2 className="text-balance text-base font-semibold sm:text-lg">Intopia Hub, operated by Team 25</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">B2B trading, contracts and Datalog tools for the ADM 4711 cohort.</p>
          </div>
        </div>
        <ul className="flex flex-wrap items-start justify-center gap-4">
          {TEAM_25_MEMBERS.map((op, i) => (
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
                    <span className="relative size-14 rounded-full ring-2 ring-border transition-all group-hover:ring-primary">
                      <span className="absolute inset-0 overflow-hidden rounded-full">
                        <Image src={op.imageUrl} alt="" fill sizes="112px" className="origin-[50%_30%] scale-200 object-cover object-top" />
                      </span>
                      <span
                        aria-hidden
                        className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-sm bg-primary text-[10px] font-bold lowercase text-primary-foreground ring-2 ring-card"
                      >
                        in
                      </span>
                    </span>
                    <span className="line-clamp-1 text-xs font-medium group-hover:text-primary">{op.name}</span>
                    <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{op.role}</span>
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
