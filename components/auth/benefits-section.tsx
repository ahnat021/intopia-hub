import { Clock, Scale, Server, ShieldCheck, type LucideIcon } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Complete Privacy.",
    body: "We don't ask for your cash balances or strategies. Intopia Hub only organizes the exact same data you already share in the course WhatsApp: Team Numbers, Buy/Sell Intentions, and Quantities.",
  },
  {
    icon: Server,
    title: "Zero Sunday Crashes.",
    body: "Built on Vercel and Supabase. Enterprise-grade infrastructure guaranteed to handle all 75 teams logging in right before the processing deadline.",
  },
  {
    icon: Clock,
    title: "Save Hours of Scrolling.",
    body: "Stop digging through 400 WhatsApp messages to find a battery supplier. Filter active market deals in two seconds.",
  },
  {
    icon: Scale,
    title: "Neutral Venue.",
    body: "A strictly neutral, level playing field designed to help everyone clear their inventory and manage contracts in one place.",
  },
]

export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-title" className="relative flex w-full max-w-4xl flex-col gap-4">
      <h2 id="benefits-title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Benefits &amp; Privacy
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex">
            <Card className="w-full gap-0 bg-card/95 py-5 backdrop-blur">
              <CardHeader className="gap-3 px-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <CardTitle className="text-base leading-snug">{title}</CardTitle>
                <CardDescription className="text-pretty text-sm leading-relaxed">{body}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
