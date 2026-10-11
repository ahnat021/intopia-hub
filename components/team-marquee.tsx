import Image from "next/image"

const HEADSHOTS = [1, 2, 3, 4].map((n) => `/images/team-25/headshot-${n}.png`)
const MESSAGE = "Like what you see? Come work with Team 25"

function Segment({ hidden }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-6 pr-6">
      {HEADSHOTS.map((src, i) => (
        <div key={src} className="flex items-center gap-6">
          <span className="whitespace-nowrap text-xs font-medium tracking-wide">{MESSAGE}</span>
          <Image src={src} alt="" width={24} height={24} className="size-6 rounded-full object-cover ring-2 ring-primary-foreground/30" />
          {i === HEADSHOTS.length - 1 ? null : <span className="size-1 rounded-full bg-primary-foreground/50" />}
        </div>
      ))}
    </div>
  )
}

export function TeamMarquee() {
  return (
    <div className="group relative flex h-9 items-center overflow-hidden bg-primary text-primary-foreground" role="marquee" aria-label={MESSAGE}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        <Segment />
        <Segment hidden />
      </div>
    </div>
  )
}
